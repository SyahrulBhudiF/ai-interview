import { Schema } from "effect";

import { EvaluationCategorySchema, EvaluationPointSchema } from "./evaluation";

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
  recommendations: Schema.Array(Schema.String),
  scores: Schema.Array(CompetencyScoreSchema),
});

export type InterviewPlan = Schema.Schema.Type<typeof InterviewPlanSchema>;
export type CvExtraction = Schema.Schema.Type<typeof CvExtractionSchema>;
export type EvaluationReport = Schema.Schema.Type<typeof EvaluationReportSchema>;

/** A Gemini model surfaced in the picker, as returned by the models list API. */
export const GeminiModelSchema = Schema.Struct({
  name: Schema.String,
  displayName: Schema.String,
  description: Schema.String,
});

export type GeminiModel = Schema.Schema.Type<typeof GeminiModelSchema>;
