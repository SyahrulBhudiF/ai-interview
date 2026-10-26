---
name: building-api-modules
description: Adds or changes an Elysia 2 + Effect v4 API module following the controller/service/error/mapper split, the ok/fail response envelope, and the Effect-at-the-boundary rules. Use when creating or editing a domain module under apps/api.
---

# Building API modules

Elysia 2 (Kiana) + Effect v4 backend. Read `apps/api/AGENTS.md` first — it is the
authoritative rule set. This skill is the step-by-step path.

## Module layout

One directory per domain under `apps/api/src/modules/<name>/`:

```text
modules/<name>/
├── index.ts     Elysia controller — HTTP only, thin
├── service.ts   business logic (Effect service when it has deps/errors)
├── error.ts     domain errors (Schema.TaggedError)
├── mapper.ts    database row → shared wire type
```

Reference implementations: `modules/greet` (pure logic, plain function) and
`modules/user` (real dependency + typed error, full Effect service).

## Steps for a new module

1. Add the request/response schemas to `packages/shared/src/schemas/` as Effect
   `Schema.Struct` (wire timestamps are ISO strings). Re-export from the index.
2. Write `service.ts`:
   - **Pure logic** → a plain function (`modules/greet/service.ts`). Do NOT wrap it
     in `Context.Service`/`Layer`/`ManagedRuntime`.
   - **Real effect** (async, typed error, resource, dependency) → `Context.Service`
     - `Layer` + `Schema.TaggedError` (`modules/user/service.ts` + `error.ts`).
3. Write `error.ts` for domain failures with `Schema.TaggedError`.
4. Write `mapper.ts` mapping the Drizzle `$inferSelect` row to the shared wire type.
5. Write `index.ts`: a thin Elysia controller. Return `ok(...)`, declare `response`
   with `Schema.toStandardSchemaV1(ApiSuccessSchema(...))` and OpenAPI `detail`.
   Run effects at the boundary: `runtime.runPromise` (async) or `runtime.runSync`
   (sync) from `src/runtime.ts`, via `Service.use((s) => s.method(...))`.
6. If the module has a service layer, add it to the single runtime in
   `src/runtime.ts` (`ManagedRuntime.make(Layer.mergeAll(...))`).
7. If it has new errors, map them in `plugins/logger.ts` `resolveErrorDefinition`
   (by `_tag`/`code`) to the envelope.

## Rules that are easy to miss

- Every response is `{ ok: true, data }` or `{ ok: false, error, requestId }`.
  Never return a bare payload.
- `yield*` inside Effect, `await` only at the controller boundary.
- `Layer.succeed` for stateless services, `Layer.effect` for stateful/dependent,
  `Effect.acquireRelease` for resources.
- Never leak internal error details; `resolveErrorDefinition` maps everything to a
  stable code/message.
