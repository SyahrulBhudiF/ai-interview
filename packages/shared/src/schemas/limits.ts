import { Schema } from "effect";

/**
 * Upper bounds for user-supplied text. Every request body is capped so a client
 * cannot push unbounded data into Postgres or into a Gemini prompt.
 */
export const TEXT_LIMITS = {
  title: 200,
  jobPosition: 200,
  language: 50,
  model: 100,
  jobDescription: 20_000,
  context: 20_000,
  cvText: 100_000,
  answer: 10_000,
  entryId: 200,
  stageName: 200,
  questionsPerStage: 10,
  stages: 8,
} as const;

/** Upload limits for file inputs. */
export const FILE_LIMITS = {
  cvBytes: 10 * 1024 * 1024,
} as const;

/** Limits for the CV evidence highlights returned by Gemini. */
export const CV_HIGHLIGHT_LIMITS = {
  minQuoteLength: 10,
  maxHighlights: 6,
} as const;

/** A string of at most `max` characters. */
export function boundedString(max: number) {
  return Schema.String.check(Schema.isMaxLength(max));
}

/** A non-empty string of at most `max` characters. */
export function boundedNonEmptyString(max: number) {
  return Schema.NonEmptyString.check(Schema.isMaxLength(max));
}
