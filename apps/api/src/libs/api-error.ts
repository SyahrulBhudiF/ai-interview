export interface ApiErrorDefinition<
  Code extends string,
  Status extends number,
  Message extends string,
> {
  readonly code: Code;
  readonly status: Status;
  readonly message: Message;
}

export abstract class ApiError extends Error {
  abstract readonly definition: ApiErrorDefinition<string, number, string>;
}

export function defineApiError<
  const Code extends string,
  const Status extends number,
  const Message extends string,
>(definition: ApiErrorDefinition<Code, Status, Message>) {
  return class extends ApiError {
    static readonly definition = definition;
    readonly definition = definition;

    constructor() {
      super(definition.message);
      this.name = definition.code;
    }
  };
}

export const NotFoundError = defineApiError({
  code: "NOT_FOUND",
  status: 404,
  message: "Not found",
});

export const ParseError = defineApiError({
  code: "PARSE",
  status: 400,
  message: "Invalid request",
});

export const ValidationError = defineApiError({
  code: "VALIDATION",
  status: 422,
  message: "Invalid request",
});

export const InternalError = defineApiError({
  code: "INTERNAL_ERROR",
  status: 500,
  message: "Server error",
});

export const GeminiNotConfiguredError = defineApiError({
  code: "GEMINI_NOT_CONFIGURED",
  status: 503,
  message: "Gemini is not configured",
});

export const GeminiUpstreamError = defineApiError({
  code: "GEMINI_ERROR",
  status: 502,
  message: "Gemini request failed",
});

export const ConflictError = defineApiError({
  code: "CONFLICT",
  status: 409,
  message: "Invalid state",
});
