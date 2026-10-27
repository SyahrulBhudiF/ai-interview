import { ApiSuccessSchema, InterviewSchema, PracticeRequestSchema } from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { PracticeService } from "./service";

export const practice = new Elysia({ prefix: "/api", tags: ["Practice"] }).post(
  "/practice",
  {
    body: Schema.toStandardSchemaV1(PracticeRequestSchema),
    response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
    detail: {
      summary: "Create a practice interview",
      description:
        "Creates a ready interview whose generated plan focuses on the requested weak competency.",
    },
  },
  async ({ body }) =>
    ok(
      await runtime.runPromise(
        PracticeService.use((service) => service.createPracticeInterview(body.category)),
      ),
    ),
);
