import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import { ApiSuccessSchema, GreetRequestSchema, HealthResponseSchema } from "./api";

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

  it.effect("rejects an empty greet name", () =>
    Effect.sync(() => {
      const result = Schema.decodeUnknownExit(GreetRequestSchema)({ name: "" });
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
