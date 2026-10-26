import { ApiSuccessSchema, HealthResponseSchema } from "@repo/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "../../libs/response";

export function createHealthController() {
  return new Elysia({ prefix: "/api", tags: ["App"] }).get(
    "/health",
    {
      response: {
        200: Schema.toStandardSchemaV1(ApiSuccessSchema(HealthResponseSchema)),
      },
      detail: {
        summary: "Health check",
        description: "Returns the API service health status.",
      },
    },
    () => ok({ name: "ai-interview-api", status: "ok", uptime: process.uptime() }),
  );
}

export const health = createHealthController();
