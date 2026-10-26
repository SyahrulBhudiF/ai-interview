import type { CreateInterview, Interview } from "@repo/shared";
import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "../../database/client";
import { interviews, type NewInterview } from "../../database/schema";
import { InterviewNotFoundError } from "./error";
import { toInterview } from "./mapper";

export class InterviewService extends Context.Service<
  InterviewService,
  {
    listInterviews(): Effect.Effect<ReadonlyArray<Interview>>;
    getInterviewById(id: string): Effect.Effect<Interview, InterviewNotFoundError>;
    createInterview(input: CreateInterview): Effect.Effect<Interview>;
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
        };

        const inserted = yield* Effect.promise(() => db.insert(interviews).values(row).returning());

        const created = inserted[0];
        if (!created) return yield* Effect.die("Expected insert to return a row");
        return toInterview(created);
      });

      return InterviewService.of({ listInterviews, getInterviewById, createInterview });
    }),
  );
}
