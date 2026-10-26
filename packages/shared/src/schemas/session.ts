import { Schema } from "effect";

export const SessionStatusSchema = Schema.Literals([
  "created",
  "ready",
  "in_progress",
  "paused",
  "completed",
  "interrupted",
  "cancelled",
]);

export const SessionSchema = Schema.Struct({
  id: Schema.String,
  interviewId: Schema.String,
  status: SessionStatusSchema,
  currentStageId: Schema.optional(Schema.String),
  currentQuestionId: Schema.optional(Schema.String),
  startedAt: Schema.optional(Schema.String),
  endedAt: Schema.optional(Schema.String),
  createdAt: Schema.String,
});

export const TranscriptRoleSchema = Schema.Literals(["ai", "candidate"]);

export const TranscriptEntrySchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  role: TranscriptRoleSchema,
  text: Schema.String,
  questionId: Schema.optional(Schema.String),
  order: Schema.Number,
  createdAt: Schema.String,
});

export type Session = Schema.Schema.Type<typeof SessionSchema>;
export type TranscriptEntry = Schema.Schema.Type<typeof TranscriptEntrySchema>;
