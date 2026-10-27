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
export type TranscriptRole = Schema.Schema.Type<typeof TranscriptRoleSchema>;
export type TranscriptEntry = Schema.Schema.Type<typeof TranscriptEntrySchema>;

/** POST /api/sessions/:id/answer */
export const AnswerRequestSchema = Schema.Struct({
  text: Schema.NonEmptyString,
});

export const SessionStartResponseSchema = Schema.Struct({
  session: SessionSchema,
  question: Schema.String,
});

export const SessionAnswerResponseSchema = Schema.Struct({
  session: SessionSchema,
  interviewerMessage: Schema.String,
  finished: Schema.Boolean,
});

export const SessionDetailResponseSchema = Schema.Struct({
  session: SessionSchema,
  transcript: Schema.Array(TranscriptEntrySchema),
});

/** POST /api/sessions/:id/realtime-token — the ephemeral Gemini Live token. */
export const RealtimeTokenResponseSchema = Schema.Struct({
  provider: Schema.String,
  token: Schema.String,
  expiresAt: Schema.Number,
  config: Schema.Struct({
    model: Schema.optional(Schema.String),
  }),
});

export type AnswerRequest = Schema.Schema.Type<typeof AnswerRequestSchema>;
export type SessionStartResponse = Schema.Schema.Type<typeof SessionStartResponseSchema>;
export type SessionAnswerResponse = Schema.Schema.Type<typeof SessionAnswerResponseSchema>;
export type SessionDetailResponse = Schema.Schema.Type<typeof SessionDetailResponseSchema>;
export type RealtimeTokenResponse = Schema.Schema.Type<typeof RealtimeTokenResponseSchema>;
