import { openapi } from "@elysia/openapi";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { env } from "@/config/env";
import { ok } from "@/libs/response";
import { cv } from "@/modules/cv";
import { cvReview } from "@/modules/cv-review";
import { evaluation } from "@/modules/evaluation";
import { gemini } from "@/modules/gemini";
import { health } from "@/modules/health";
import { interview } from "@/modules/interview";
import { plan } from "@/modules/interview/plan";
import { practice } from "@/modules/practice";
import { progress } from "@/modules/progress";
import { session } from "@/modules/session";
import { Log, loggerPlugin } from "@/plugins/logger";
import { rateLimitPlugin } from "@/plugins/rate-limit";

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
  .use(rateLimitPlugin)
  .get("/", () => ok({ name: "ai-interview-api" }))
  .use(health)
  .use(cv)
  .use(cvReview)
  .use(interview)
  .use(plan)
  .use(practice)
  .use(progress)
  .use(session)
  .use(evaluation)
  .use(gemini);

if (import.meta.main) {
  app.listen({
    port: env.port,
    idleTimeout: env.idleTimeoutSeconds,
    maxRequestBodySize: env.maxRequestBodyBytes,
  });
  Log.info("API ready at {url}", { url: `http://localhost:${env.port}` });
}

export type App = typeof app;
