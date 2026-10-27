import type { Session, SessionWithScore } from "@ai-interview/shared";
import { desc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { evaluations, interviews, sessions, type NewSession } from "@/database/schema";

import { InterviewNotReadyError, InvalidSessionStateError, SessionNotFoundError } from "./error";
import { toSession } from "./mapper";

export interface ISessionService {
  createSession(interviewId: string): Effect.Effect<Session, InterviewNotReadyError>;
  getSession(id: string): Effect.Effect<Session, SessionNotFoundError>;
  listByInterview(interviewId: string): Effect.Effect<ReadonlyArray<SessionWithScore>>;
  startSession(id: string): Effect.Effect<Session, SessionNotFoundError | InvalidSessionStateError>;
  setCurrentQuestion(
    id: string,
    stageId: string,
    questionId: string,
  ): Effect.Effect<Session, SessionNotFoundError>;
  completeSession(
    id: string,
  ): Effect.Effect<Session, SessionNotFoundError | InvalidSessionStateError>;
}

export class SessionService extends Context.Service<SessionService, ISessionService>()(
  "ai-interview/session/SessionService",
) {
  static readonly layer = Layer.effect(
    SessionService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const createSession = Effect.fn("SessionService.createSession")(function* (
        interviewId: string,
      ) {
        const interviewRows = yield* Effect.promise(() =>
          db.select().from(interviews).where(eq(interviews.id, interviewId)).limit(1),
        );

        const interview = interviewRows[0];
        if (!interview || interview.status !== "ready") {
          return yield* new InterviewNotReadyError({ interviewId });
        }

        const row: NewSession = { id: crypto.randomUUID(), interviewId, status: "created" };

        const inserted = yield* Effect.promise(() => db.insert(sessions).values(row).returning());

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toSession(created);
      });

      const getSession = Effect.fn("SessionService.getSession")(function* (id: string) {
        const rows = yield* Effect.promise(() =>
          db.select().from(sessions).where(eq(sessions.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new SessionNotFoundError({ id });
        return toSession(row);
      });

      const listByInterview = Effect.fn("SessionService.listByInterview")(function* (
        interviewId: string,
      ) {
        const sessionRows = yield* Effect.promise(() =>
          db
            .select()
            .from(sessions)
            .where(eq(sessions.interviewId, interviewId))
            .orderBy(desc(sessions.createdAt)),
        );

        if (sessionRows.length === 0) return [];

        const evaluationRows = yield* Effect.promise(() =>
          db
            .select({ sessionId: evaluations.sessionId, overallScore: evaluations.overallScore })
            .from(evaluations)
            .where(
              inArray(
                evaluations.sessionId,
                sessionRows.map((session) => session.id),
              ),
            ),
        );

        const scoreBySession = new Map(evaluationRows.map((e) => [e.sessionId, e.overallScore]));

        return sessionRows.map((session) => ({
          session: toSession(session),
          overallScore: scoreBySession.get(session.id),
        }));
      });

      const startSession = Effect.fn("SessionService.startSession")(function* (id: string) {
        const rows = yield* Effect.promise(() =>
          db.select().from(sessions).where(eq(sessions.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new SessionNotFoundError({ id });
        if (row.status !== "created") {
          return yield* new InvalidSessionStateError({
            id,
            status: row.status,
            expected: "created",
          });
        }

        const updated = yield* Effect.promise(() =>
          db
            .update(sessions)
            .set({ status: "in_progress", startedAt: new Date() })
            .where(eq(sessions.id, id))
            .returning(),
        );

        const result = updated[0];
        if (!result) return yield* new SessionNotFoundError({ id });
        return toSession(result);
      });

      const setCurrentQuestion = Effect.fn("SessionService.setCurrentQuestion")(function* (
        id: string,
        stageId: string,
        questionId: string,
      ) {
        const updated = yield* Effect.promise(() =>
          db
            .update(sessions)
            .set({ currentStageId: stageId, currentQuestionId: questionId })
            .where(eq(sessions.id, id))
            .returning(),
        );

        const result = updated[0];
        if (!result) return yield* new SessionNotFoundError({ id });
        return toSession(result);
      });

      const completeSession = Effect.fn("SessionService.completeSession")(function* (id: string) {
        const rows = yield* Effect.promise(() =>
          db.select().from(sessions).where(eq(sessions.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new SessionNotFoundError({ id });
        if (row.status !== "in_progress") {
          return yield* new InvalidSessionStateError({
            id,
            status: row.status,
            expected: "in_progress",
          });
        }

        const updated = yield* Effect.promise(() =>
          db
            .update(sessions)
            .set({ status: "completed", endedAt: new Date() })
            .where(eq(sessions.id, id))
            .returning(),
        );

        const result = updated[0];
        if (!result) return yield* new SessionNotFoundError({ id });
        return toSession(result);
      });

      return SessionService.of({
        createSession,
        getSession,
        listByInterview,
        startSession,
        setCurrentQuestion,
        completeSession,
      });
    }),
  );
}
