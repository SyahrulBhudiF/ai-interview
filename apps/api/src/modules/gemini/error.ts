import { Schema } from "effect";

/** Gemini is not configured — `GEMINI_API_KEY` is missing. */
export class GeminiApiKeyMissingError extends Schema.TaggedError<GeminiApiKeyMissingError>()(
  "GeminiApiKeyMissingError",
  {},
) {}

/** A Gemini request failed (network, rate limit, or invalid output). */
export class GeminiGenerationError extends Schema.TaggedError<GeminiGenerationError>()(
  "GeminiGenerationError",
  {
    message: Schema.String,
  },
) {}

/** Listing the available Gemini models failed (bad key, quota, or network). */
export class GeminiModelListError extends Schema.TaggedError<GeminiModelListError>()(
  "GeminiModelListError",
  {
    message: Schema.String,
  },
) {}

export type GeminiError = GeminiApiKeyMissingError | GeminiGenerationError | GeminiModelListError;
