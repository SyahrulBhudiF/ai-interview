import {
  AnswerRequestSchema,
  ApiSuccessSchema,
  SessionAnswerResponseSchema,
  SessionDetailResponseSchema,
  SessionSchema,
  SessionStartResponseSchema,
} from "@ai-interview/shared";
import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { InterviewOrchestratorService } from "./orchestrator/service";
import { SessionService } from "./service";
import { TranscriptService } from "./transcript/service";

export const session = new Elysia({ prefix: "/api", tags: ["Session"] })
  .post(
    "/interviews/:id/sessions",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(SessionSchema)) },
      detail: {
        summary: "Create a session",
        description: "Creates a session for a ready interview.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(SessionService.use((service) => service.createSession(params.id))),
      ),
  )
  .post(
    "/sessions/:id/start",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(SessionStartResponseSchema)) },
      detail: {
        summary: "Start a session",
        description: "Starts the session and returns the first question.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          InterviewOrchestratorService.use((service) => service.start(params.id)),
        ),
      ),
  )
  .post(
    "/sessions/:id/answer",
    {
      body: Schema.toStandardSchemaV1(AnswerRequestSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(SessionAnswerResponseSchema)) },
      detail: {
        summary: "Answer the current question",
        description: "Records the candidate's answer and returns the interviewer's next message.",
      },
    },
    async ({ params, body }) =>
      ok(
        await runtime.runPromise(
          InterviewOrchestratorService.use((service) => service.answer(params.id, body.text)),
        ),
      ),
  )
  .get(
    "/sessions/:id",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(SessionDetailResponseSchema)) },
      detail: {
        summary: "Get a session",
        description: "Returns the session and its transcript.",
      },
    },
    async ({ params }) => {
      const detail = await runtime.runPromise(
        Effect.gen(function* () {
          const sessionRow = yield* SessionService.use((service) => service.getSession(params.id));
          const transcript = yield* TranscriptService.use((service) => service.list(params.id));

          return { session: sessionRow, transcript };
        }),
      );

      return ok(detail);
    },
  )
  .post(
    "/sessions/:id/end",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(SessionSchema)) },
      detail: {
        summary: "End a session",
        description: "Completes an in-progress session.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          SessionService.use((service) => service.completeSession(params.id)),
        ),
      ),
  );
