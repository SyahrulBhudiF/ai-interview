import type { Session } from "@ai-interview/shared";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { interviews, sessions, type NewSession } from "@/database/schema";

import { InterviewNotReadyError, InvalidSessionStateError, SessionNotFoundError } from "./error";
import { toSession } from "./mapper";

export class SessionService extends Context.Service<
  SessionService,
  {
    createSession(interviewId: string): Effect.Effect<Session, InterviewNotReadyError>;
    getSession(id: string): Effect.Effect<Session, SessionNotFoundError>;
    startSession(
      id: string,
    ): Effect.Effect<Session, SessionNotFoundError | InvalidSessionStateError>;
    setCurrentQuestion(
      id: string,
      stageId: string,
      questionId: string,
    ): Effect.Effect<Session, SessionNotFoundError>;
    completeSession(
      id: string,
    ): Effect.Effect<Session, SessionNotFoundError | InvalidSessionStateError>;
  }
>()("ai-interview/session/SessionService") {
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
        startSession,
        setCurrentQuestion,
        completeSession,
      });
    }),
  );
}
