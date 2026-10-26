import { Schema } from "effect";

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  {
    id: Schema.String,
  },
) {}
