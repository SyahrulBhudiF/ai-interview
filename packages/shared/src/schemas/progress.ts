import { Schema } from "effect";

import { EvaluationCategorySchema } from "./evaluation";

export const ProgressSummarySchema = Schema.Struct({
  interviews: Schema.Number,
  sessions: Schema.Number,
  completedSessions: Schema.Number,
  evaluatedSessions: Schema.Number,
  averageScore: Schema.optional(Schema.Number),
});

export const ProgressScoreSchema = Schema.Struct({
  sessionId: Schema.String,
  interviewId: Schema.String,
  interviewTitle: Schema.String,
  overallScore: Schema.Number,
  createdAt: Schema.String,
});

export const CompetencyAverageSchema = Schema.Struct({
  category: EvaluationCategorySchema,
  average: Schema.Number,
  count: Schema.Number,
});

export const ProgressSchema = Schema.Struct({
  summary: ProgressSummarySchema,
  scoreHistory: Schema.Array(ProgressScoreSchema),
  competencyAverages: Schema.Array(CompetencyAverageSchema),
});

export type ProgressSummary = Schema.Schema.Type<typeof ProgressSummarySchema>;
export type ProgressScore = Schema.Schema.Type<typeof ProgressScoreSchema>;
export type CompetencyAverage = Schema.Schema.Type<typeof CompetencyAverageSchema>;
export type Progress = Schema.Schema.Type<typeof ProgressSchema>;
