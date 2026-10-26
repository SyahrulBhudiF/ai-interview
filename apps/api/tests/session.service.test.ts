import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";

import { Database } from "../src/database/client";
import { toSession, toTranscriptEntry } from "../src/modules/session/mapper";
import { SessionService } from "../src/modules/session/service";

describe("session mappers", () => {
  it("maps a session row with nullable fields to the wire type", () => {
    const session = toSession({
      id: "s1",
      interviewId: "i1",
      status: "in_progress",
      currentStageId: null,
      currentQuestionId: null,
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      endedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    assert.strictEqual(session.status, "in_progress");
    assert.strictEqual(session.startedAt, "2026-01-01T00:00:00.000Z");
    assert.strictEqual(session.endedAt, undefined);
    assert.strictEqual(session.currentQuestionId, undefined);
  });

  it("maps a transcript row", () => {
    const entry = toTranscriptEntry({
      id: "t1",
      sessionId: "s1",
      role: "candidate",
      text: "hello",
      questionId: null,
      order: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    assert.strictEqual(entry.role, "candidate");
    assert.strictEqual(entry.questionId, undefined);
  });
});

describe("SessionService.getSession", () => {
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
  const provide = SessionService.layer.pipe(Layer.provide(stubDatabaseLayer));

  it.effect("fails with a typed error for a missing session", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        SessionService.use((service) => service.getSession("missing")),
      );

      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(provide)),
  );
});
