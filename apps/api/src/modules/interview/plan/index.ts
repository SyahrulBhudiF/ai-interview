import { ApiSuccessSchema, InterviewPlanSchema } from "@repo/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { InterviewPlanService } from "./service";

export const plan = new Elysia({ prefix: "/api", tags: ["Interview plan"] })
  .get(
    "/interviews/:id/plan",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewPlanSchema)) },
      detail: {
        summary: "Get an interview plan",
        description: "Returns the saved plan for the interview (empty when none is saved yet).",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(InterviewPlanService.use((service) => service.getPlan(params.id))),
      ),
  )
  .put(
    "/interviews/:id/plan",
    {
      body: Schema.toStandardSchemaV1(InterviewPlanSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewPlanSchema)) },
      detail: {
        summary: "Save an interview plan",
        description: "Replaces the saved stages and questions for the interview.",
      },
    },
    async ({ params, body }) =>
      ok(
        await runtime.runPromise(
          InterviewPlanService.use((service) => service.savePlan(params.id, body)),
        ),
      ),
  );
