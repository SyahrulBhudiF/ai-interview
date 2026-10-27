import type { CreateInterview, Interview, InterviewBehavior } from "@ai-interview/shared";
import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { interviews, type NewInterview } from "@/database/schema";

import { InterviewNotFoundError } from "./error";
import { toInterview } from "./mapper";

export class InterviewService extends Context.Service<
  InterviewService,
  {
    listInterviews(): Effect.Effect<ReadonlyArray<Interview>>;
    getInterviewById(id: string): Effect.Effect<Interview, InterviewNotFoundError>;
    createInterview(input: CreateInterview): Effect.Effect<Interview>;
    updateBehavior(
      id: string,
      behavior: InterviewBehavior,
    ): Effect.Effect<Interview, InterviewNotFoundError>;
  }
>()("ai-interview/interview/InterviewService") {
  static readonly layer = Layer.effect(
    InterviewService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const listInterviews = Effect.fn("InterviewService.listInterviews")(function* () {
        const rows = yield* Effect.promise(() =>
          db.select().from(interviews).orderBy(desc(interviews.createdAt)),
        );

        return rows.map(toInterview);
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
        const row: NewInterview = {
          id: crypto.randomUUID(),
          title: input.title,
          jobPosition: input.jobPosition,
          experienceLevel: input.experienceLevel,
          jobDescription: input.jobDescription ?? null,
          context: input.context ?? null,
          language: input.language,
          difficulty: input.difficulty,
          model: input.model ?? "gemini-3.8-flash",
          allowFollowUps: input.allowFollowUps ?? true,
          generateDetailedFeedback: input.generateDetailedFeedback ?? true,
          strictMode: input.strictMode ?? false,
        };

        const inserted = yield* Effect.promise(() => db.insert(interviews).values(row).returning());

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toInterview(created);
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

      return InterviewService.of({
        listInterviews,
        getInterviewById,
        createInterview,
        updateBehavior,
      });
    }),
  );
}
