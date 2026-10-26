import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";

import { Database } from "@/database/client";
import { toUser } from "@/modules/user/mapper";
import { UserService } from "@/modules/user/service";

describe("toUser", () => {
  it("maps a database row to the wire type", () => {
    const user = toUser({
      id: "1",
      email: "ada@example.com",
      name: "Ada",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    assert.strictEqual(user.createdAt, "2026-01-01T00:00:00.000Z");
    assert.strictEqual(user.name, "Ada");
  });
});

describe("UserService", () => {
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
  const provide = UserService.layer.pipe(Layer.provide(stubDatabaseLayer));

  it.effect("getUserById fails with a typed error for a missing user", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(UserService.use((service) => service.getUserById("missing")));
      assert.isTrue(Exit.isFailure(exit));
    }).pipe(Effect.provide(provide)),
  );
});
