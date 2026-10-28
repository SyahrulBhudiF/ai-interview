import { Schema } from "effect";

/** Shared API envelope/error contracts. Add domain schemas in sibling files. */

/** Success envelope: `{ ok: true, data }`. Wrap every payload in this. */
export const ApiSuccessSchema = <const S extends Schema.Schema<unknown>>(data: S) =>
  Schema.Struct({
    ok: Schema.Literal(true),
    data,
  });

export const ApiIssueSchema = Schema.Struct({
  path: Schema.optional(Schema.String),
  message: Schema.String,
});

export const ApiErrorSchema = Schema.Struct({
  code: Schema.String,
  message: Schema.String,
  issues: Schema.optional(Schema.Array(ApiIssueSchema)),
});

/** Error envelope: `{ ok: false, error, requestId }`. Returned by the global error handler. */
export const ApiErrorResponseSchema = Schema.Struct({
  ok: Schema.Literal(false),
  error: ApiErrorSchema,
  requestId: Schema.String,
});

/** GET /api/health */
export const HealthResponseSchema = Schema.Struct({
  name: Schema.String,
  status: Schema.Literal("ok"),
  uptime: Schema.Number,
});

export type ApiSuccess<T> = { readonly ok: true; readonly data: T };
export type ApiIssue = Schema.Schema.Type<typeof ApiIssueSchema>;
export type ApiError = Schema.Schema.Type<typeof ApiErrorSchema>;
export type ApiErrorResponse = Schema.Schema.Type<typeof ApiErrorResponseSchema>;
export type HealthResponse = Schema.Schema.Type<typeof HealthResponseSchema>;
