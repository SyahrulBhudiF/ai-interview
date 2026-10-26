import { Schema } from "effect";

export class SessionNotFoundError extends Schema.TaggedError<SessionNotFoundError>()(
  "SessionNotFoundError",
  {
    id: Schema.String,
  },
) {}

export class InterviewNotReadyError extends Schema.TaggedError<InterviewNotReadyError>()(
  "InterviewNotReadyError",
  {
    interviewId: Schema.String,
  },
) {}

export class InvalidSessionStateError extends Schema.TaggedError<InvalidSessionStateError>()(
  "InvalidSessionStateError",
  {
    id: Schema.String,
    status: Schema.String,
    expected: Schema.String,
  },
) {}
