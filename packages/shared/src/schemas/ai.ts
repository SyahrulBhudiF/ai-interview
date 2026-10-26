import { Schema } from "effect";

import { EvaluationCategorySchema } from "./evaluation";

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

export const StageScoreSchema = Schema.Struct({
  stageId: Schema.String,
  score: Schema.Number,
  feedback: Schema.String,
});

export const CompetencyScoreSchema = Schema.Struct({
  category: EvaluationCategorySchema,
  score: Schema.Number,
  feedback: Schema.String,
});

export const QuestionFeedbackSchema = Schema.Struct({
  questionId: Schema.String,
  score: Schema.Number,
  feedback: Schema.String,
  improvedAnswer: Schema.optional(Schema.String),
});

/** Output of the interview evaluator. */
export const EvaluationReportSchema = Schema.Struct({
  overallScore: Schema.Number,
  summary: Schema.String,
  strengths: Schema.Array(Schema.String),
  improvements: Schema.Array(Schema.String),
  recommendations: Schema.Array(Schema.String),
  stageScores: Schema.Array(StageScoreSchema),
  competencyScores: Schema.Array(CompetencyScoreSchema),
  questionFeedback: Schema.Array(QuestionFeedbackSchema),
});

export type InterviewPlan = Schema.Schema.Type<typeof InterviewPlanSchema>;
export type EvaluationReport = Schema.Schema.Type<typeof EvaluationReportSchema>;
