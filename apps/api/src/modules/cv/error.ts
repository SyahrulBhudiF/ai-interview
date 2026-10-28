import { Schema } from "effect";

export class InvalidCvFileError extends Schema.TaggedError<InvalidCvFileError>()(
  "InvalidCvFileError",
  {
    message: Schema.String,
  },
) {}
