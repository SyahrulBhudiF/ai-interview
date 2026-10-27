import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context, Effect, Layer } from "effect";
import postgres from "postgres";

import { env } from "@/config/env";

import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

export interface IDatabase {
  readonly db: Db;
}

export class Database extends Context.Service<Database, IDatabase>()(
  "ai-interview/database/Database",
) {
  static readonly layer = Layer.effect(
    Database,
    Effect.gen(function* () {
      const client = yield* Effect.acquireRelease(
        Effect.sync(() => postgres(env.databaseUrl, { max: 10 })),
        (sql) => Effect.promise(() => sql.end()),
      );

      return Database.of({ db: drizzle(client, { schema }) });
    }),
  );
}
