import { openapi } from "@elysia/openapi";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { env } from "@/config/env";
import { ok } from "@/libs/response";
import { evaluation } from "@/modules/evaluation";
import { gemini } from "@/modules/gemini";
import { greet } from "@/modules/greet";
import { health } from "@/modules/health";
import { interview } from "@/modules/interview";
import { plan } from "@/modules/interview/plan";
import { progress } from "@/modules/progress";
import { session } from "@/modules/session";
import { user } from "@/modules/user";
import { Log, loggerPlugin } from "@/plugins/logger";

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
  .use(user)
  .use(interview)
  .use(plan)
  .use(progress)
  .use(session)
  .use(evaluation)
  .use(gemini);

if (import.meta.main) {
  // Long Gemini calls (plan generation, evaluation) can exceed Bun's 10s idle timeout.
  app.listen({ port: env.port, idleTimeout: 120 });
  Log.info("API ready at {url}", { url: `http://localhost:${env.port}` });
}

export type App = typeof app;
