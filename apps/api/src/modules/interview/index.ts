import {
  ApiSuccessSchema,
  CreateInterviewSchema,
  InterviewPlanSchema,
  InterviewSchema,
} from "@repo/shared";
import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "../../libs/response";
import { runtime } from "../../runtime";
import { GeminiService } from "../gemini/service";
import { InterviewService } from "./service";

export const interview = new Elysia({ prefix: "/api", tags: ["Interview"] })
  .get(
    "/interviews",
    {
      response: {
        200: Schema.toStandardSchemaV1(ApiSuccessSchema(Schema.Array(InterviewSchema))),
      },
      detail: {
        summary: "List interviews",
        description: "Returns all interviews, newest first.",
      },
    },
    async () =>
      ok(await runtime.runPromise(InterviewService.use((service) => service.listInterviews()))),
  )
  .post(
    "/interviews",
    {
      body: Schema.toStandardSchemaV1(CreateInterviewSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
      detail: {
        summary: "Create an interview",
        description: "Creates a draft interview.",
      },
    },
    async ({ body }) =>
      ok(
        await runtime.runPromise(InterviewService.use((service) => service.createInterview(body))),
      ),
  )
  .get(
    "/interviews/:id",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
      detail: {
        summary: "Get an interview",
        description: "Returns one interview by id.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          InterviewService.use((service) => service.getInterviewById(params.id)),
        ),
      ),
  )
  .post(
    "/interviews/:id/generate-plan",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewPlanSchema)) },
      detail: {
        summary: "Generate an interview plan",
        description: "Generates a structured stage/question plan with Gemini for the interview.",
      },
    },
    async ({ params }) => {
      const plan = await runtime.runPromise(
        Effect.gen(function* () {
          const found = yield* InterviewService.use((service) =>
            service.getInterviewById(params.id),
          );

          return yield* GeminiService.use((service) => service.generateInterviewPlan(found));
        }),
      );

      return ok(plan);
    },
  );
