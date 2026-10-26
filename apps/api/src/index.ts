import { openapi } from "@elysia/openapi";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { env } from "./config/env";
import { ok } from "./libs/response";
import { greet } from "./modules/greet";
import { health } from "./modules/health";
import { user } from "./modules/user";
import { Log, loggerPlugin } from "./plugins/logger";

export const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: "AI Interview API",
          version: "0.1.0",
          description: "AI Interview API — Elysia 2 + Effect v4",
        },
      },
      mapJsonSchema: {
        effect: (schema: Schema.Schema<unknown>) => Schema.toJsonSchemaDocument(schema).schema,
      },
    }),
  )
  .use(loggerPlugin)
  .get("/", () => ok({ name: "ai-interview-api" }))
  .use(health)
  .use(greet)
  .use(user);

if (import.meta.main) {
  app.listen(env.port);
  Log.info("API ready at {url}", { url: `http://localhost:${env.port}` });
}

export type App = typeof app;
