import type { Interview, SessionAnswerResponse, SessionStartResponse } from "@ai-interview/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { interviews, interviewStages, questions } from "@/database/schema";
import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";
import { toInterview } from "@/modules/interview/mapper";

import { InterviewNotReadyError, InvalidSessionStateError, SessionNotFoundError } from "../error";
import { toStageNodes } from "../mapper";
import {
  firstQuestion,
  followUpAllowed,
  followUpsUsed,
  nextQuestion,
  type StageNode,
} from "../progression";
import { SessionService } from "../service";
import { TranscriptService } from "../transcript/service";

export interface IInterviewOrchestratorService {
  start(
    sessionId: string,
  ): Effect.Effect<
    SessionStartResponse,
    SessionNotFoundError | InterviewNotReadyError | InvalidSessionStateError
  >;
  answer(
    sessionId: string,
    text: string,
  ): Effect.Effect<
    SessionAnswerResponse,
    SessionNotFoundError | InvalidSessionStateError | GeminiError
  >;
  getLiveContext(
    sessionId: string,
  ): Effect.Effect<
    { interview: Interview; question: string },
    SessionNotFoundError | InvalidSessionStateError
  >;
}

export class InterviewOrchestratorService extends Context.Service<
  InterviewOrchestratorService,
  IInterviewOrchestratorService
>()("ai-interview/session/InterviewOrchestratorService") {
  static readonly layer = Layer.effect(
    InterviewOrchestratorService,
    Effect.gen(function* () {
      const { db } = yield* Database;
      const sessionService = yield* SessionService;
      const transcriptService = yield* TranscriptService;
      const geminiService = yield* GeminiService;

      const loadPlan = Effect.fn("Orchestrator.loadPlan")(function* (
        interviewId: string,
      ): Effect.fn.Return<StageNode[], never> {
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

        return toStageNodes(stageRows, questionRows);
      });

      const loadInterview = Effect.fn("Orchestrator.loadInterview")(function* (
        interviewId: string,
      ) {
        const rows = yield* Effect.promise(() =>
          db.select().from(interviews).where(eq(interviews.id, interviewId)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* Effect.die("Session references a missing interview");
        return toInterview(row);
      });

      const start = Effect.fn("Orchestrator.start")(function* (
        sessionId: string,
      ): Effect.fn.Return<
        SessionStartResponse,
        SessionNotFoundError | InterviewNotReadyError | InvalidSessionStateError
      > {
        const session = yield* sessionService.getSession(sessionId);
        const plan = yield* loadPlan(session.interviewId);
        const first = firstQuestion(plan);

        if (!first) return yield* new InterviewNotReadyError({ interviewId: session.interviewId });

        yield* sessionService.startSession(sessionId);

        const positioned = yield* sessionService.setCurrentQuestion(
          sessionId,
          first.stageId,
          first.id,
        );

        yield* transcriptService.append(sessionId, "ai", first.text, first.id);

        return { session: positioned, question: first.text };
      });

      const answer = Effect.fn("Orchestrator.answer")(function* (
        sessionId: string,
        text: string,
      ): Effect.fn.Return<
        SessionAnswerResponse,
        SessionNotFoundError | InvalidSessionStateError | GeminiError
      > {
        const session = yield* sessionService.getSession(sessionId);

        if (
          session.status !== "in_progress" ||
          !session.currentStageId ||
          !session.currentQuestionId
        ) {
          return yield* new InvalidSessionStateError({
            id: sessionId,
            status: session.status,
            expected: "in_progress",
          });
        }

        const [interview, plan] = yield* Effect.all(
          [loadInterview(session.interviewId), loadPlan(session.interviewId)],
          { concurrency: "unbounded" },
        );

        const stage = plan.find((s) => s.id === session.currentStageId);

        const current = stage?.questions.find(
          (question) => question.id === session.currentQuestionId,
        );

        if (!stage || !current) {
          return yield* new InvalidSessionStateError({
            id: sessionId,
            status: session.status,
            expected: "in_progress",
          });
        }

        yield* transcriptService.append(sessionId, "candidate", text, current.id);

        const entries = yield* transcriptService.list(sessionId);
        const used = followUpsUsed(entries, current.id);

        if (followUpAllowed(interview.allowFollowUps, stage, used)) {
          const followUp = yield* geminiService.generateFollowUp(interview, current.text, text);
          yield* transcriptService.append(sessionId, "ai", followUp, current.id);

          return { session, interviewerMessage: followUp, finished: false };
        }

        const next = nextQuestion(plan, session.currentStageId, session.currentQuestionId);

        if (next) {
          const positioned = yield* sessionService.setCurrentQuestion(
            sessionId,
            next.stageId,
            next.id,
          );

          yield* transcriptService.append(sessionId, "ai", next.text, next.id);

          return { session: positioned, interviewerMessage: next.text, finished: false };
        }

        const completed = yield* sessionService.completeSession(sessionId);
        const closing = "That concludes the interview. Thank you!";
        yield* transcriptService.append(sessionId, "ai", closing);

        return { session: completed, interviewerMessage: closing, finished: true };
      });

      const getLiveContext = Effect.fn("Orchestrator.getLiveContext")(function* (
        sessionId: string,
      ): Effect.fn.Return<
        { interview: Interview; question: string },
        SessionNotFoundError | InvalidSessionStateError
      > {
        const session = yield* sessionService.getSession(sessionId);

        if (
          session.status !== "in_progress" ||
          !session.currentStageId ||
          !session.currentQuestionId
        ) {
          return yield* new InvalidSessionStateError({
            id: sessionId,
            status: session.status,
            expected: "in_progress",
          });
        }

        const [interview, plan] = yield* Effect.all(
          [loadInterview(session.interviewId), loadPlan(session.interviewId)],
          { concurrency: "unbounded" },
        );

        const stage = plan.find((s) => s.id === session.currentStageId);

        const current = stage?.questions.find(
          (question) => question.id === session.currentQuestionId,
        );

        if (!current) {
          return yield* new InvalidSessionStateError({
            id: sessionId,
            status: session.status,
            expected: "in_progress",
          });
        }

        return { interview, question: current.text };
      });

      return InterviewOrchestratorService.of({ start, answer, getLiveContext });
    }),
  );
}
