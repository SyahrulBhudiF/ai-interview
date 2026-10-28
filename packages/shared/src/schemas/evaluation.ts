import { Schema } from "effect";

export const EvaluationCategorySchema = Schema.Literals([
  "technical_knowledge",
  "problem_solving",
  "communication",
  "relevance",
  "depth",
  "reasoning",
  "role_specific",
]);

export const EvaluationScoreSchema = Schema.Struct({
  category: EvaluationCategorySchema,
  score: Schema.Number,
  feedback: Schema.optional(Schema.String),
  stageId: Schema.optional(Schema.String),
  questionId: Schema.optional(Schema.String),
});

/** A strength or an area to improve, with the reason Gemini gives for it. */
export const EvaluationPointSchema = Schema.Struct({
  point: Schema.String,
  reason: Schema.String,
});

export const EvaluationSchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  overallScore: Schema.Number,
  summary: Schema.String,
  strengths: Schema.Array(EvaluationPointSchema),
  improvements: Schema.Array(EvaluationPointSchema),
  recommendations: Schema.Array(Schema.String),
  createdAt: Schema.String,
});

export type EvaluationCategory = Schema.Schema.Type<typeof EvaluationCategorySchema>;
export type EvaluationPoint = Schema.Schema.Type<typeof EvaluationPointSchema>;
export type Evaluation = Schema.Schema.Type<typeof EvaluationSchema>;
export type EvaluationScore = Schema.Schema.Type<typeof EvaluationScoreSchema>;
