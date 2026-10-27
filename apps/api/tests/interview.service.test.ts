import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";

import { Database } from "@/database/client";
import { toInterview } from "@/modules/interview/mapper";
import { InterviewService } from "@/modules/interview/service";

describe("toInterview", () => {
  it("maps a database row to the wire type", () => {
    const interview = toInterview({
      id: "interview-1",
      title: "Senior Backend Engineer",
      jobPosition: "Backend Engineer",
      experienceLevel: "senior",
      jobDescription: null,
      context: null,
      language: "en",
      difficulty: "intermediate",
      status: "draft",
      model: "gemini-3.8-flash",
      allowFollowUps: true,
      generateDetailedFeedback: true,
      strictMode: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    assert.strictEqual(interview.createdAt, "2026-01-01T00:00:00.000Z");
    assert.strictEqual(interview.updatedAt, "2026-01-02T00:00:00.000Z");
    assert.strictEqual(interview.experienceLevel, "senior");
    assert.strictEqual(interview.jobDescription, undefined);
    assert.strictEqual(interview.allowFollowUps, true);
  });
});

describe("InterviewService", () => {
  const emptyDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    }),
  } as unknown as Database["Service"]["db"];

  const stubDatabaseLayer = Layer.succeed(Database, Database.of({ db: emptyDb }));
  const provide = InterviewService.layer.pipe(Layer.provide(stubDatabaseLayer));

  it.effect("getInterviewById fails with a typed error for a missing interview", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        InterviewService.use((service) => service.getInterviewById("missing")),
      );

      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(provide)),
  );
});
