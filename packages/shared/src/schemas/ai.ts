import { Schema } from "effect";

import { CvHighlightSchema, EvaluationCategorySchema, EvaluationPointSchema } from "./evaluation";
import { TEXT_LIMITS } from "./limits";

/** Gemini structured outputs. These schemas are the `outputSchema` for TanStack AI. */

export const GeneratedQuestionSchema = Schema.Struct({
  text: Schema.String,
  answerCriteria: Schema.optional(Schema.Array(Schema.String)),
  rubric: Schema.optional(Schema.String),
});

export const GeneratedStageSchema = Schema.Struct({
  name: Schema.String,
  objective: Schema.optional(Schema.String),
  competencies: Schema.Array(Schema.String),
  questions: Schema.Array(GeneratedQuestionSchema),
});

/** Output of the interview plan generator. */
export const InterviewPlanSchema = Schema.Struct({
  stages: Schema.Array(GeneratedStageSchema),
});

/**
 * Bounded form of the plan schema for untrusted input: the plan save endpoint
 * and the Gemini structured output. Responses keep using `InterviewPlanSchema`
 * so plans saved before the caps still load.
 */
export const InterviewPlanInputSchema = Schema.Struct({
  stages: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      objective: Schema.optional(Schema.String),
      competencies: Schema.Array(Schema.String),
      questions: Schema.Array(GeneratedQuestionSchema).check(
        Schema.isMaxLength(TEXT_LIMITS.questionsPerStage),
      ),
    }),
  ).check(Schema.isMaxLength(TEXT_LIMITS.stages)),
});

/** Output of the CV extractor: the PDF's readable text, kept as interview context. */
export const CvExtractionSchema = Schema.Struct({
  cvText: Schema.String,
});

export const CompetencyScoreSchema = Schema.Struct({
  category: EvaluationCategorySchema,
  score: Schema.Number,
  feedback: Schema.String,
});

/** Output of the interview evaluator — rubric scores per competency. */
export const EvaluationReportSchema = Schema.Struct({
  overallScore: Schema.Number,
  summary: Schema.String,
  strengths: Schema.Array(EvaluationPointSchema),
  improvements: Schema.Array(EvaluationPointSchema),
  cvHighlights: Schema.Array(CvHighlightSchema),
  recommendations: Schema.Array(Schema.String),
  scores: Schema.Array(CompetencyScoreSchema),
});

export type InterviewPlan = Schema.Schema.Type<typeof InterviewPlanSchema>;
export type InterviewPlanInput = Schema.Schema.Type<typeof InterviewPlanInputSchema>;
export type CvExtraction = Schema.Schema.Type<typeof CvExtractionSchema>;
export type EvaluationReport = Schema.Schema.Type<typeof EvaluationReportSchema>;

/** A Gemini model surfaced in the picker, as returned by the models list API. */
export const GeminiModelSchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  description: Schema.String,
});

/** One entry of Gemini's `models.list` response. */
export const GeminiModelEntrySchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  description: Schema.String,
  supportedGenerationMethods: Schema.optional(Schema.Array(Schema.String)),
});

/** The `models.list` response body, as returned by the Gemini API. */
export const GeminiModelListResponseSchema = Schema.Struct({
  models: Schema.optional(Schema.Array(GeminiModelEntrySchema)),
});

export type GeminiModel = Schema.Schema.Type<typeof GeminiModelSchema>;
export type GeminiModelListResponse = Schema.Schema.Type<typeof GeminiModelListResponseSchema>;
