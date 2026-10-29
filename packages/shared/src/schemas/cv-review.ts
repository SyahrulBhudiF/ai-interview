import { Schema } from "effect";

import { EvaluationReportSchema } from "./ai";
import { ExperienceLevelSchema } from "./interview";
import { boundedNonEmptyString, boundedString, TEXT_LIMITS } from "./limits";

/** A standalone CV review: a role target plus the reviewed CV and its report. */
export const CvReviewSchema = Schema.Struct({
  id: Schema.String,
  jobPosition: Schema.String,
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(Schema.String),
  cvText: Schema.String,
  language: Schema.String,
  model: Schema.String,
  report: EvaluationReportSchema,
  createdAt: Schema.String,
});

/** A row in the recent-reviews list; the full report stays on the detail endpoint. */
export const CvReviewSummarySchema = Schema.Struct({
  id: Schema.String,
  jobPosition: Schema.String,
  experienceLevel: ExperienceLevelSchema,
  overallScore: Schema.Number,
  createdAt: Schema.String,
});

/** Body for POST /cv-reviews. */
export const CreateCvReviewSchema = Schema.Struct({
  jobPosition: boundedNonEmptyString(TEXT_LIMITS.jobPosition),
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(boundedString(TEXT_LIMITS.jobDescription)),
  cvText: boundedNonEmptyString(TEXT_LIMITS.cvText),
  language: boundedNonEmptyString(TEXT_LIMITS.language),
  model: Schema.optional(boundedNonEmptyString(TEXT_LIMITS.model)),
});

export const DeletedCvReviewSchema = Schema.Struct({ id: Schema.String });

export type CvReview = Schema.Schema.Type<typeof CvReviewSchema>;
export type CvReviewSummary = Schema.Schema.Type<typeof CvReviewSummarySchema>;
export type CreateCvReview = Schema.Schema.Type<typeof CreateCvReviewSchema>;
export type DeletedCvReview = Schema.Schema.Type<typeof DeletedCvReviewSchema>;
