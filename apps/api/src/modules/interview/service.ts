import type {
  CreateInterview,
  Interview,
  InterviewBehavior,
  InterviewSummary,
  UpdateInterview,
} from "@ai-interview/shared";
import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { interviews } from "@/database/schema";

import { InterviewNotFoundError } from "./error";
import {
  duplicateInterviewRow,
  interviewUpdate,
  newInterviewRow,
  toInterview,
  toInterviewSummary,
} from "./mapper";

export interface IInterviewService {
  listInterviews(): Effect.Effect<ReadonlyArray<InterviewSummary>>;
  getInterviewById(id: string): Effect.Effect<Interview, InterviewNotFoundError>;
  createInterview(input: CreateInterview): Effect.Effect<Interview>;
  updateInterview(
    id: string,
    input: UpdateInterview,
  ): Effect.Effect<Interview, InterviewNotFoundError>;
  duplicateInterview(id: string): Effect.Effect<Interview, InterviewNotFoundError>;
  deleteInterview(id: string): Effect.Effect<{ id: string }, InterviewNotFoundError>;
  updateBehavior(
    id: string,
    behavior: InterviewBehavior,
  ): Effect.Effect<Interview, InterviewNotFoundError>;
}

export class InterviewService extends Context.Service<InterviewService, IInterviewService>()(
  "ai-interview/interview/InterviewService",
) {
  static readonly layer = Layer.effect(
    InterviewService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const listInterviews = Effect.fn("InterviewService.listInterviews")(function* () {
        // The list never reads the candidate's free text; it stays on the detail endpoint.
        const rows = yield* Effect.promise(() =>
          db
            .select({
              id: interviews.id,
              title: interviews.title,
              jobPosition: interviews.jobPosition,
              experienceLevel: interviews.experienceLevel,
              difficulty: interviews.difficulty,
              status: interviews.status,
              model: interviews.model,
              createdAt: interviews.createdAt,
              updatedAt: interviews.updatedAt,
            })
            .from(interviews)
            .orderBy(desc(interviews.createdAt)),
        );

        return rows.map(toInterviewSummary);
      });

      const getInterviewById = Effect.fn("InterviewService.getInterviewById")(function* (
        id: string,
      ) {
        const rows = yield* Effect.promise(() =>
          db.select().from(interviews).where(eq(interviews.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new InterviewNotFoundError({ id });
        return toInterview(row);
      });

      const createInterview = Effect.fn("InterviewService.createInterview")(function* (
        input: CreateInterview,
      ) {
        const inserted = yield* Effect.promise(() =>
          db.insert(interviews).values(newInterviewRow(input)).returning(),
        );

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toInterview(created);
      });

      const updateInterview = Effect.fn("InterviewService.updateInterview")(function* (
        id: string,
        input: UpdateInterview,
      ) {
        const updated = yield* Effect.promise(() =>
          db
            .update(interviews)
            .set(interviewUpdate(input))
            .where(eq(interviews.id, id))
            .returning(),
        );

        const row = updated[0];
        if (!row) return yield* new InterviewNotFoundError({ id });
        return toInterview(row);
      });

      const updateBehavior = Effect.fn("InterviewService.updateBehavior")(function* (
        id: string,
        behavior: InterviewBehavior,
      ) {
        const updated = yield* Effect.promise(() =>
          db
            .update(interviews)
            .set({
              allowFollowUps: behavior.allowFollowUps,
              generateDetailedFeedback: behavior.generateDetailedFeedback,
              strictMode: behavior.strictMode,
              updatedAt: new Date(),
            })
            .where(eq(interviews.id, id))
            .returning(),
        );

        const row = updated[0];
        if (!row) return yield* new InterviewNotFoundError({ id });
        return toInterview(row);
      });

      const duplicateInterview = Effect.fn("InterviewService.duplicateInterview")(function* (
        id: string,
      ) {
        const rows = yield* Effect.promise(() =>
          db.select().from(interviews).where(eq(interviews.id, id)).limit(1),
        );

        const source = rows[0];
        if (!source) return yield* new InterviewNotFoundError({ id });

        const inserted = yield* Effect.promise(() =>
          db.insert(interviews).values(duplicateInterviewRow(source)).returning(),
        );

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toInterview(created);
      });

      const deleteInterview = Effect.fn("InterviewService.deleteInterview")(function* (id: string) {
        const deleted = yield* Effect.promise(() =>
          db.delete(interviews).where(eq(interviews.id, id)).returning({ id: interviews.id }),
        );

        const row = deleted[0];
        if (!row) return yield* new InterviewNotFoundError({ id });
        return row;
      });

      return InterviewService.of({
        listInterviews,
        getInterviewById,
        createInterview,
        updateInterview,
        duplicateInterview,
        deleteInterview,
        updateBehavior,
      });
    }),
  );
}
