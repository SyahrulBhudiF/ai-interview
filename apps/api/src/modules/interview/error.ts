import { Schema } from "effect";

export class InterviewNotFoundError extends Schema.TaggedError<InterviewNotFoundError>()(
  "InterviewNotFoundError",
  {
    id: Schema.String,
  },
) {}
