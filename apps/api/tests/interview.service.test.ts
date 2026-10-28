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
      cvText: null,
      language: "en",
      difficulty: "intermediate",
      status: "draft",
      model: "gemini-3.8-flash",
      persona: "professional",
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
    assert.strictEqual(interview.cvText, undefined);
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

describe("InterviewService update and delete", () => {
  const row = {
    id: "interview-1",
    title: "Updated title",
    jobPosition: "Backend Engineer",
    experienceLevel: "senior",
    jobDescription: null,
    context: null,
    language: "en",
    difficulty: "advanced",
    status: "draft",
    model: "gemini-3.8-flash",
    persona: "professional",
    allowFollowUps: true,
    generateDetailedFeedback: true,
    strictMode: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  let updatePayload: Record<string, unknown> | undefined;

  const db = {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        updatePayload = values;
        return { where: () => ({ returning: () => Promise.resolve([row]) }) };
      },
    }),
    delete: () => ({
      where: () => ({ returning: () => Promise.resolve([{ id: "interview-1" }]) }),
    }),
  } as unknown as Database["Service"]["db"];

  const provide = InterviewService.layer.pipe(
    Layer.provide(Layer.succeed(Database, Database.of({ db }))),
  );

  it.effect("updates the editable configuration", () =>
    Effect.gen(function* () {
      const interview = yield* InterviewService.use((service) =>
        service.updateInterview("interview-1", {
          title: "Updated title",
          jobPosition: "Backend Engineer",
          experienceLevel: "senior",
          language: "en",
          difficulty: "advanced",
          model: "gemini-3.8-flash",
          persona: "professional",
        }),
      );

      assert.strictEqual(interview.title, "Updated title");
      assert.strictEqual(interview.jobDescription, undefined);
      assert.strictEqual(interview.updatedAt, "2026-01-02T00:00:00.000Z");
      assert.strictEqual(updatePayload?.jobDescription, null);
      assert.strictEqual(updatePayload?.context, null);
      assert.isTrue(updatePayload?.updatedAt instanceof Date);
    }).pipe(Effect.provide(provide)),
  );

  it.effect("deletes an interview and returns its id", () =>
    Effect.gen(function* () {
      const deleted = yield* InterviewService.use((service) =>
        service.deleteInterview("interview-1"),
      );

      assert.deepStrictEqual(deleted, { id: "interview-1" });
    }).pipe(Effect.provide(provide)),
  );
});

describe("InterviewService list", () => {
  const row = {
    id: "interview-1",
    title: "Senior Backend Engineer",
    jobPosition: "Backend Engineer",
    experienceLevel: "senior",
    jobDescription: "A job description",
    context: "Some context",
    cvText: "The candidate's CV",
    language: "en",
    difficulty: "intermediate",
    status: "draft",
    model: "gemini-3.8-flash",
    persona: "professional",
    allowFollowUps: true,
    generateDetailedFeedback: true,
    strictMode: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  const db = {
    select: () => ({
      from: () => ({ orderBy: () => Promise.resolve([row]) }),
    }),
  } as unknown as Database["Service"]["db"];

  const provide = InterviewService.layer.pipe(
    Layer.provide(Layer.succeed(Database, Database.of({ db }))),
  );

  it.effect("lists summaries without the candidate's free text", () =>
    Effect.gen(function* () {
      const [summary] = yield* InterviewService.use((service) => service.listInterviews());

      assert.strictEqual(summary?.title, "Senior Backend Engineer");
      assert.strictEqual(summary?.createdAt, "2026-01-01T00:00:00.000Z");
      assert.notProperty(summary, "cvText");
      assert.notProperty(summary, "jobDescription");
      assert.notProperty(summary, "context");
    }).pipe(Effect.provide(provide)),
  );
});
