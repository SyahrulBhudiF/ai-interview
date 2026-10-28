import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import { ApiSuccessSchema, HealthResponseSchema } from "./api";
import { CreateCvReviewSchema } from "./cv-review";

describe("shared API schemas", () => {
  it.effect("decodes a success envelope", () =>
    Effect.gen(function* () {
      const schema = ApiSuccessSchema(HealthResponseSchema);

      const decoded = yield* Schema.decodeUnknownEffect(schema)({
        ok: true,
        data: { name: "ai-interview-api", status: "ok", uptime: 3 },
      });

      assert.deepStrictEqual(decoded, {
        ok: true,
        data: { name: "ai-interview-api", status: "ok", uptime: 3 },
      });
    }),
  );

  it.effect("rejects an empty job position", () =>
    Effect.sync(() => {
      const result = Schema.decodeUnknownExit(CreateCvReviewSchema)({
        jobPosition: "",
        experienceLevel: "mid",
        cvText: "Some CV text",
        language: "en",
      });

      assert.isTrue(Exit.isFailure(result));
    }),
  );

  it.effect("rejects a success envelope whose ok flag is false", () =>
    Effect.sync(() => {
      const schema = ApiSuccessSchema(HealthResponseSchema);
      const result = Schema.decodeUnknownExit(schema)({ ok: false });
      assert.isTrue(Exit.isFailure(result));
    }),
  );
});
