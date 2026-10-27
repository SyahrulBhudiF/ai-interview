import {
  ApiSuccessSchema,
  CreateInterviewSchema,
  DeletedInterviewSchema,
  GeneratePlanRequestSchema,
  InterviewBehaviorSchema,
  InterviewPlanSchema,
  InterviewSchema,
  UpdateInterviewSchema,
} from "@ai-interview/shared";
import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { GeminiService } from "@/modules/gemini/service";
import { runtime } from "@/runtime";

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
  .put(
    "/interviews/:id",
    {
      body: Schema.toStandardSchemaV1(UpdateInterviewSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
      detail: {
        summary: "Update an interview",
        description: "Replaces the interview's editable configuration.",
      },
    },
    async ({ params, body }) =>
      ok(
        await runtime.runPromise(
          InterviewService.use((service) => service.updateInterview(params.id, body)),
        ),
      ),
  )
  .delete(
    "/interviews/:id",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(DeletedInterviewSchema)) },
      detail: {
        summary: "Delete an interview",
        description: "Deletes the interview and cascades its plan, sessions, and evaluations.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          InterviewService.use((service) => service.deleteInterview(params.id)),
        ),
      ),
  )
  .put(
    "/interviews/:id/behavior",
    {
      body: Schema.toStandardSchemaV1(InterviewBehaviorSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
      detail: {
        summary: "Update interview behavior",
        description: "Updates the follow-up, feedback, and strictness settings for an interview.",
      },
    },
    async ({ params, body }) =>
      ok(
        await runtime.runPromise(
          InterviewService.use((service) => service.updateBehavior(params.id, body)),
        ),
      ),
  )
  .post(
    "/interviews/:id/duplicate",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewSchema)) },
      detail: {
        summary: "Duplicate an interview",
        description: "Copies the interview's configuration into a new draft (a template).",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          InterviewService.use((service) => service.duplicateInterview(params.id)),
        ),
      ),
  )
  .post(
    "/interviews/:id/generate-plan",
    {
      body: Schema.toStandardSchemaV1(GeneratePlanRequestSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(InterviewPlanSchema)) },
      detail: {
        summary: "Generate an interview plan",
        description:
          "Generates a structured stage/question plan with Gemini. Pass stages to fill a defined structure, or an empty array to let Gemini design the whole plan.",
      },
    },
    async ({ params, body }) => {
      const plan = await runtime.runPromise(
        Effect.gen(function* () {
          const found = yield* InterviewService.use((service) =>
            service.getInterviewById(params.id),
          );

          return yield* GeminiService.use((service) =>
            service.generateInterviewPlan(found, body.stages),
          );
        }),
      );

      return ok(plan);
    },
  );
