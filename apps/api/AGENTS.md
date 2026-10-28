# AGENTS.md — apps/api

Elysia 2 (Kiana) + Effect v4 backend.

## Module layout

One directory per domain under `src/modules/<name>/`:

```text
modules/<name>/
├── index.ts     Elysia controller — HTTP only, thin
├── service.ts   business logic (Effect service when it has deps/errors)
├── error.ts     domain errors (Schema.TaggedError)
├── mapper.ts    database row ($inferSelect) → shared wire type
```

- Controllers return `ok(...)` and declare `response` schemas + OpenAPI `detail`.
- `health` is controller-only (trivial); a domain gets a `service.ts` once it has
  real logic.
- The single app runtime lives in `src/runtime.ts` (`ManagedRuntime` over all
  service layers). Add each new module's `.layer` there.

## Effect rules

- **Pure logic → plain function** (see `modules/session/progression.ts`). Do NOT wrap
  pure functions in `Context.Service`/`Layer`/`ManagedRuntime`.
- **Effect service** only for real effects: `Context.Service` + `Layer` +
  `Schema.TaggedError` (see `modules/interview/service.ts` + `error.ts`).
- `Layer.succeed` for stateless services, `Layer.effect` for stateful/dependent
  ones, `Effect.acquireRelease` for resources (see `database/client.ts`).
- Inside Effect use `yield*` (never `await`); at the controller boundary run once
  with `runtime.runPromise` (async) or `runtime.runSync` (sync).

## Errors & response contract

- `libs/api-error.ts`: `ApiError` + `defineApiError` + built-ins (NOT_FOUND/PARSE/
  VALIDATION/INTERNAL_ERROR).
- Domain errors use `Schema.TaggedError` in the module's `error.ts`.
- `libs/response.ts`: `ok(data)` / `fail({ code, message, issues?, requestId })`.
- The global `onError` in `plugins/logger.ts` maps errors (via `_tag`/`code` in
  `resolveErrorDefinition`) to the envelope; never leak internal error details.

## Config, logging, database

- `config/env.ts`: Effect `Config` (`Config.Literals`, `Config.withDefault`).
- `plugins/logger.ts`: Effect `Logger` + `ManagedRuntime`; request logging in
  `onAfterResponse`, error mapping/logging in `onError("global", ...)`.
- `database/`: Drizzle schema in `schema.ts`, the `Database` Effect service in
  `client.ts`. Migrations in `apps/api/drizzle/` (`bun run --filter api db:*`).
