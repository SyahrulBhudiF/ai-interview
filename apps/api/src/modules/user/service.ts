import type { User } from "@ai-interview/shared";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { users } from "@/database/schema";

import { UserNotFoundError } from "./error";
import { toUser } from "./mapper";

export interface IUserService {
  listUsers(): Effect.Effect<ReadonlyArray<User>>;
  getUserById(id: string): Effect.Effect<User, UserNotFoundError>;
}

export class UserService extends Context.Service<UserService, IUserService>()(
  "ai-interview/user/UserService",
) {
  static readonly layer = Layer.effect(
    UserService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const listUsers = Effect.fn("UserService.listUsers")(function* () {
        const rows = yield* Effect.promise(() => db.select().from(users));
        return rows.map(toUser);
      });

      const getUserById = Effect.fn("UserService.getUserById")(function* (id: string) {
        const rows = yield* Effect.promise(() =>
          db.select().from(users).where(eq(users.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new UserNotFoundError({ id });
        return toUser(row);
      });

      return UserService.of({ listUsers, getUserById });
    }),
  );
}
