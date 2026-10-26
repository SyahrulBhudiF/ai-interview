import { Effect, Layer, Logger, ManagedRuntime, Match, Predicate, References } from "effect";
import { Elysia } from "elysia";

import { env } from "../config/env";
import {
  ApiError,
  InternalError,
  NotFoundError,
  ParseError,
  ValidationError,
} from "../libs/api-error";
import { fail } from "../libs/response";

type Level = "info" | "warning" | "error";

const effectLogLevel = {
  debug: "Debug",
  info: "Info",
  warning: "Warn",
  error: "Error",
  fatal: "Fatal",
} as const;

const runtime = ManagedRuntime.make(
  Logger.layer([env.nodeEnv === "production" ? Logger.consoleJson : Logger.consolePretty()]).pipe(
    Layer.provideMerge(Layer.succeed(References.MinimumLogLevel, effectLogLevel[env.logLevel])),
  ),
);

function emit(level: Level, message: string, details: Record<string, unknown> = {}) {
  const base = Match.value(level).pipe(
    Match.when("info", () => Effect.logInfo(message)),
    Match.when("warning", () => Effect.logWarning(message)),
    Match.orElse(() => Effect.logError(message)),
  );

  runtime.runSync(base.pipe(Effect.annotateLogs(details)));
}

export const Log = {
  info: (message: string, details?: Record<string, unknown>) => emit("info", message, details),
  warning: (message: string, details?: Record<string, unknown>) =>
    emit("warning", message, details),
  error: (message: string, details?: Record<string, unknown>) => emit("error", message, details),
};

/** Per-request state for request logging (same `Request` object flows through the lifecycle). */
const requestState = new WeakMap<Request, { requestId: string; startTime: number }>();

/** Maps any thrown error to a stable response definition (code + status + message). */
function resolveErrorDefinition(error: unknown) {
  if (error instanceof ApiError) return error.definition;

  if (!Predicate.isObject(error)) return InternalError.definition;

  const token =
    (error as { _tag?: unknown; code?: unknown })._tag ?? (error as { code?: unknown }).code;

  return Match.value(token).pipe(
    Match.when("UserNotFoundError", () => NotFoundError.definition),
    Match.when("validation", () => ValidationError.definition),
    Match.when("not-found", () => NotFoundError.definition),
    Match.when("parse", () => ParseError.definition),
    Match.orElse(() => InternalError.definition),
  );
}

/** Extracts field issues from Elysia 2's validation error (`errors: { path, message }[]`). */
function getValidationIssues(error: unknown) {
  if (!Predicate.isObject(error)) return undefined;

  const issues = (error as { errors?: unknown }).errors;
  if (!Array.isArray(issues)) return undefined;

  return issues.map((issue) =>
    Match.value(issue).pipe(
      Match.when(Predicate.isObject, (value) => {
        const { path, message } = value as { path?: unknown; message?: unknown };
        return {
          path: Match.value(path).pipe(
            Match.when(Array.isArray, (segments) => segments.map(String).join(".")),
            Match.when(Predicate.isString, (pathValue) => pathValue),
            Match.orElse(() => undefined),
          ),
          message: Predicate.isString(message) ? message : "Invalid value",
        };
      }),
      Match.orElse(() => ({ message: String(issue) })),
    ),
  );
}

export const loggerPlugin = new Elysia({ name: "logger" })
  .onRequest(({ request, set }) => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    set.headers["x-request-id"] = requestId;
    requestState.set(request, { requestId, startTime: performance.now() });
  })
  .onAfterResponse("global", ({ request, set, path }) => {
    const state = requestState.get(request);
    requestState.delete(request);
    if (!state) return;

    const status = set.status ?? 200;
    const durationMs = Math.round(performance.now() - state.startTime);

    emit("info", `${request.method} ${path} ${status} (${durationMs}ms)`, {
      method: request.method,
      path,
      status,
      requestId: state.requestId,
      durationMs,
    });
  })
  .onError("global", ({ error, request, set }) => {
    const state = requestState.get(request);
    requestState.delete(request);

    const definition = resolveErrorDefinition(error);

    const requestId =
      state?.requestId ?? request.headers.get("x-request-id") ?? crypto.randomUUID();

    set.headers["x-request-id"] = requestId;
    set.status = definition.status;

    const path = new URL(request.url).pathname;

    const errorDetail =
      definition.status >= 500 ? error : error instanceof Error ? error.message : String(error);

    const level = Match.value(definition.status).pipe(
      Match.when(
        (status) => status >= 500,
        () => "error" as const,
      ),
      Match.orElse(() => "warning" as const),
    );

    emit(level, `Request failed: ${request.method} ${path} (${definition.code})`, {
      method: request.method,
      path,
      code: definition.code,
      status: definition.status,
      requestId,
      error: errorDetail,
    });

    return fail({
      code: definition.code,
      message: definition.message,
      requestId,
      issues: definition.code === "VALIDATION" ? getValidationIssues(error) : undefined,
    });
  });
