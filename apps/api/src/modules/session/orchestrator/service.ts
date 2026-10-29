import type {
  AnswerRequest,
  Interview,
  SessionAnswerResponse,
  SessionStartResponse,
} from "@ai-interview/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import {
  interviews,
  interviewStages,
  questions,
  sessions,
  transcriptEntries,
} from "@/database/schema";
import { encryptText } from "@/libs/encryption";
import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";
import { toInterview } from "@/modules/interview/mapper";

import { InterviewNotReadyError, InvalidSessionStateError, SessionNotFoundError } from "../error";
import { newTranscriptEntryRow, toStageNodes } from "../mapper";
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
    request: AnswerRequest,
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
        request: AnswerRequest,
      ): Effect.fn.Return<
        SessionAnswerResponse,
        SessionNotFoundError | InvalidSessionStateError | GeminiError
      > {
        const session = yield* sessionService.getSession(sessionId);
        const entries = yield* transcriptService.list(sessionId);

        const answeredIndex = entries.findIndex(
          (entry) => entry.id === `answer:${request.replyTo}`,
        );

        const previousResponse = entries[answeredIndex + 1];

        if (answeredIndex >= 0 && previousResponse?.role === "ai") {
          return {
            session,
            interviewerMessage: previousResponse.text,
            interviewerEntryId: previousResponse.id,
            finished: session.status === "completed",
          };
        }

        if (
          session.status !== "in_progress" ||
          !session.currentStageId ||
          !session.currentQuestionId ||
          entries.at(-1)?.id !== request.replyTo
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

        const used = followUpsUsed(entries, current.id);

        const followUp = followUpAllowed(interview.allowFollowUps, stage, used)
          ? yield* geminiService.generateFollowUp(interview, current.text, request.text)
          : undefined;

        const next = nextQuestion(plan, session.currentStageId, session.currentQuestionId);
        const finished = !followUp && !next;

        const interviewerMessage =
          followUp ??
          next?.text ??
          "Thank you for your answers. Your interview is complete. You can open your debrief now.";

        const questionId = followUp ? current.id : next?.id;

        yield* Effect.promise(() =>
          db.transaction(async (tx) => {
            const inserted = await tx
              .insert(transcriptEntries)
              .values({
                ...newTranscriptEntryRow(
                  sessionId,
                  "candidate",
                  request.text,
                  entries.length,
                  current.id,
                ),
                id: `answer:${request.replyTo}`,
              })
              .onConflictDoNothing()
              .returning();

            if (inserted.length === 0) return;

            if (request.spokenQuestion) {
              await tx
                .update(transcriptEntries)
                .set({ text: encryptText(request.spokenQuestion) })
                .where(eq(transcriptEntries.id, request.replyTo));
            }

            await tx
              .insert(transcriptEntries)
              .values(
                newTranscriptEntryRow(
                  sessionId,
                  "ai",
                  interviewerMessage,
                  entries.length + 1,
                  questionId,
                ),
              );
            await tx
              .update(sessions)
              .set(
                finished
                  ? { status: "completed", endedAt: new Date() }
                  : {
                      currentStageId: followUp ? stage.id : next?.stageId,
                      currentQuestionId: questionId,
                    },
              )
              .where(eq(sessions.id, sessionId));
          }),
        );

        const savedEntries = yield* transcriptService.list(sessionId);

        const savedAnswerIndex = savedEntries.findIndex(
          (entry) => entry.id === `answer:${request.replyTo}`,
        );

        const savedResponse = savedEntries[savedAnswerIndex + 1];
        if (!savedResponse)
          return yield* Effect.die("Expected the saved answer to have an interviewer response");
        const updated = yield* sessionService.getSession(sessionId);
        return {
          session: updated,
          interviewerMessage: savedResponse.text,
          interviewerEntryId: savedResponse.id,
          finished: updated.status === "completed",
        };
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

        const entries = yield* transcriptService.list(sessionId);
        return { interview, question: entries.at(-1)?.text ?? current.text };
      });

      return InterviewOrchestratorService.of({ start, answer, getLiveContext });
    }),
  );
}
