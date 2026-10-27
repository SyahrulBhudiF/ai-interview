import { Schema } from "effect";

export class EvaluationNotFoundError extends Schema.TaggedError<EvaluationNotFoundError>()(
  "EvaluationNotFoundError",
  {
    sessionId: Schema.String,
  },
) {}

export class SessionNotCompletedError extends Schema.TaggedError<SessionNotCompletedError>()(
  "SessionNotCompletedError",
  {
    sessionId: Schema.String,
    status: Schema.String,
  },
) {}
