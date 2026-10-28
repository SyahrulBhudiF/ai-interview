import { Schema } from "effect";

export class CvReviewNotFoundError extends Schema.TaggedError<CvReviewNotFoundError>()(
  "CvReviewNotFoundError",
  {
    id: Schema.String,
  },
) {}
