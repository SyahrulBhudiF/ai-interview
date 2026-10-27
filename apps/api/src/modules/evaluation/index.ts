import { ApiSuccessSchema, EvaluationReportSchema } from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { EvaluationService } from "./service";

export const evaluation = new Elysia({ prefix: "/api", tags: ["Evaluation"] })
  .post(
    "/sessions/:id/evaluate",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(EvaluationReportSchema)) },
      detail: {
        summary: "Evaluate a session",
        description: "Generates and saves a rubric-based evaluation for a completed session.",
      },
    },
    async ({ params }) =>
      ok(await runtime.runPromise(EvaluationService.use((service) => service.evaluate(params.id)))),
  )
  .get(
    "/sessions/:id/evaluation",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(EvaluationReportSchema)) },
      detail: {
        summary: "Get a session's evaluation",
        description: "Returns the saved evaluation report.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          EvaluationService.use((service) => service.getEvaluation(params.id)),
        ),
      ),
  );
