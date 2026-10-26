import type { ApiErrorResponse, ApiIssue, ApiSuccess } from "@ai-interview/shared";

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(input: {
  code: string;
  message: string;
  issues?: ApiIssue[];
  requestId: string;
}): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      issues: input.issues,
    },
    requestId: input.requestId,
  };
}
