import type { EvaluationReport } from "@ai-interview/shared";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import {
  evaluationScores,
  evaluations,
  interviews,
  interviewStages,
  questions,
} from "@/database/schema";
import { normalizeCvHighlights } from "@/libs/cv-highlights";
import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";
import { toInterview } from "@/modules/interview/mapper";
import { SessionNotFoundError } from "@/modules/session/error";
import { SessionService } from "@/modules/session/service";
import { TranscriptService } from "@/modules/session/transcript/service";

import { EvaluationNotFoundError, SessionNotCompletedError } from "./error";
import { newEvaluationRow, newEvaluationScoreRows, toEvaluationReport } from "./mapper";

export interface IEvaluationService {
  evaluate(
    sessionId: string,
  ): Effect.Effect<EvaluationReport, SessionNotFoundError | SessionNotCompletedError | GeminiError>;
  getEvaluation(sessionId: string): Effect.Effect<EvaluationReport, EvaluationNotFoundError>;
}

export class EvaluationService extends Context.Service<EvaluationService, IEvaluationService>()(
  "ai-interview/evaluation/EvaluationService",
) {
  static readonly layer = Layer.effect(
    EvaluationService,
    Effect.gen(function* () {
      const { db } = yield* Database;
      const sessionService = yield* SessionService;
      const transcriptService = yield* TranscriptService;
      const geminiService = yield* GeminiService;

      const loadInterview = Effect.fn("EvaluationService.loadInterview")(function* (
        interviewId: string,
      ) {
        const rows = yield* Effect.promise(() =>
          db.select().from(interviews).where(eq(interviews.id, interviewId)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* Effect.die("Session references a missing interview");
        return toInterview(row);
      });

      const loadQuestions = Effect.fn("EvaluationService.loadQuestions")(function* (
        interviewId: string,
      ): Effect.fn.Return<string[], never> {
        const stageRows = yield* Effect.promise(() =>
          db
            .select()
            .from(interviewStages)
            .where(eq(interviewStages.interviewId, interviewId))
            .orderBy(asc(interviewStages.order)),
        );

        if (stageRows.length === 0) return [];

        const questionRows = yield* Effect.promise(() =>
          db
            .select()
            .from(questions)
            .where(
              inArray(
                questions.stageId,
                stageRows.map((stage) => stage.id),
              ),
            )
            .orderBy(asc(questions.order)),
        );

        return questionRows.map((question) => question.text);
      });

      const evaluate = Effect.fn("EvaluationService.evaluate")(function* (
        sessionId: string,
      ): Effect.fn.Return<
        EvaluationReport,
        SessionNotFoundError | SessionNotCompletedError | GeminiError
      > {
        const session = yield* sessionService.getSession(sessionId);

        if (session.status !== "completed") {
          return yield* new SessionNotCompletedError({ sessionId, status: session.status });
        }

        const [interview, questionList, transcript] = yield* Effect.all(
          [
            loadInterview(session.interviewId),
            loadQuestions(session.interviewId),
            transcriptService.list(sessionId),
          ],
          { concurrency: "unbounded" },
        );

        const transcriptText = transcript.map((entry) => `${entry.role}: ${entry.text}`).join("\n");

        const report = yield* geminiService.generateEvaluation(
          interview,
          questionList,
          transcriptText,
        );

        const rounded: EvaluationReport = {
          ...report,
          overallScore: Math.round(report.overallScore),
          scores: report.scores.map((score) => ({ ...score, score: Math.round(score.score) })),
          cvHighlights: normalizeCvHighlights(report.cvHighlights),
        };

        yield* Effect.promise(() =>
          db.transaction(async (tx) => {
            // A session has one evaluation: re-evaluating replaces the report.
            await tx.delete(evaluations).where(eq(evaluations.sessionId, sessionId));

            const [evaluation] = await tx
              .insert(evaluations)
              .values(newEvaluationRow(sessionId, rounded))
              .returning();

            if (!evaluation) throw new Error("Expected insert to return a row");

            if (rounded.scores.length > 0) {
              await tx
                .insert(evaluationScores)
                .values(newEvaluationScoreRows(evaluation.id, rounded.scores));
            }
          }),
        );

        return rounded;
      });

      const getEvaluation = Effect.fn("EvaluationService.getEvaluation")(function* (
        sessionId: string,
      ): Effect.fn.Return<EvaluationReport, EvaluationNotFoundError> {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(evaluations)
            .where(eq(evaluations.sessionId, sessionId))
            .orderBy(desc(evaluations.createdAt))
            .limit(1),
        );

        const evaluation = rows[0];
        if (!evaluation) return yield* new EvaluationNotFoundError({ sessionId });

        const scores = yield* Effect.promise(() =>
          db
            .select()
            .from(evaluationScores)
            .where(eq(evaluationScores.evaluationId, evaluation.id))
            .orderBy(asc(evaluationScores.category)),
        );

        return toEvaluationReport(evaluation, scores);
      });

      return EvaluationService.of({ evaluate, getEvaluation });
    }),
  );
}
