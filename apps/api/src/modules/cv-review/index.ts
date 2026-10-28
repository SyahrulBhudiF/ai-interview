import {
  ApiSuccessSchema,
  CreateCvReviewSchema,
  CvReviewSchema,
  CvReviewSummarySchema,
  DeletedCvReviewSchema,
} from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { CvReviewService } from "./service";

export const cvReview = new Elysia({ prefix: "/api", tags: ["CV Review"] })
  .get(
    "/cv-reviews",
    {
      response: {
        200: Schema.toStandardSchemaV1(ApiSuccessSchema(Schema.Array(CvReviewSummarySchema))),
      },
      detail: {
        summary: "List CV reviews",
        description: "Returns the saved CV reviews, newest first.",
      },
    },
    async () =>
      ok(await runtime.runPromise(CvReviewService.use((service) => service.listReviews()))),
  )
  .post(
    "/cv-reviews",
    {
      body: Schema.toStandardSchemaV1(CreateCvReviewSchema),
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(CvReviewSchema)) },
      detail: {
        summary: "Review a CV",
        description: "Reviews a CV against a target role with Gemini and saves the report.",
      },
    },
    async ({ body }) =>
      ok(await runtime.runPromise(CvReviewService.use((service) => service.review(body)))),
  )
  .get(
    "/cv-reviews/:id",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(CvReviewSchema)) },
      detail: {
        summary: "Get a CV review",
        description: "Returns one saved CV review with its full report.",
      },
    },
    async ({ params }) =>
      ok(await runtime.runPromise(CvReviewService.use((service) => service.getReview(params.id)))),
  )
  .delete(
    "/cv-reviews/:id",
    {
      response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(DeletedCvReviewSchema)) },
      detail: {
        summary: "Delete a CV review",
        description: "Deletes a saved CV review.",
      },
    },
    async ({ params }) =>
      ok(
        await runtime.runPromise(CvReviewService.use((service) => service.deleteReview(params.id))),
      ),
  );
