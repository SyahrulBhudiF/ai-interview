import {
  AnswerRequestSchema,
  ApiSuccessSchema,
  RealtimeTokenResponseSchema,
  SessionAnswerResponseSchema,
  SessionDetailResponseSchema,
  SessionSchema,
  SessionStartResponseSchema,
  SessionWithScoreSchema,
} from "@ai-interview/shared";
import { Effect, Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { GeminiLiveService } from "@/modules/gemini/live";
import { runtime } from "@/runtime";

import { InterviewOrchestratorService } from "./orchestrator/service";
import { SessionService } from "./service";
import { TranscriptService } from "./transcript/service";

export const session = new Elysia({ prefix: "/api", tags: ["Session"] })
  .get(
    "/interviews/:id/sessions",
    {
      response: {
        200: Schema.toStandardSchemaV1(ApiSuccessSchema(Schema.Array(SessionWithScoreSchema))),
      },
      detail: {
        summary: "List an interview's sessions",
        description: "Returns the interview's sessions, newest first, with their overall scores.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(
          SessionService.use((service) => service.listByInterview(params.id)),
        ),
      ),
  )
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
      const [sessionRow, transcript] = await runtime.runPromise(
        Effect.all(
          [
            SessionService.use((service) => service.getSession(params.id)),
            TranscriptService.use((service) => service.list(params.id)),
          ],
          { concurrency: "unbounded" },
        ),
      );

      return ok({ session: sessionRow, transcript });
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
  )
  .post(
    "/sessions/:id/realtime-token",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(RealtimeTokenResponseSchema)) },
      detail: {
        summary: "Mint a Gemini Live token",
        description: "Returns an ephemeral token for a voice-to-voice Gemini Live session.",
      },
    },
    async ({ params }) => {
      const token = await runtime.runPromise(
        Effect.gen(function* () {
          const context = yield* InterviewOrchestratorService.use((service) =>
            service.getLiveContext(params.id),
          );

          return yield* GeminiLiveService.use((service) =>
            service.createRealtimeToken(context.interview, context.question),
          );
        }),
      );

      return ok(token);
    },
  );
