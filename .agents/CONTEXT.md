# Project context

Read this together with the root `AGENTS.md` and the per-package `AGENTS.md` files
to understand the architecture decisions behind this monorepo.

## What

`ai-interview` — an AI interview product. Monorepo (Turborepo + Bun) with two apps
and two packages, sharing Effect Schema contracts.

## Architecture decisions

1. **Effect only where it earns its keep.** Effect v4 is used for schemas, config,
   logging, and services that have real effects (async, typed errors, resources,
   dependencies). Pure logic stays a plain function. Wrapping pure functions in
   `Context.Service`/`Layer`/`ManagedRuntime` is ceremony and is rejected.

2. **Effect at the boundary, `await` only at the edge.** Inside Effect code use
   `yield*`; Elysia handlers run effects once via `runtime.runPromise`/`runSync`
   from the single app runtime (`apps/api/src/runtime.ts`).

3. **One envelope everywhere.** Success `{ ok: true, data }`; failure
   `{ ok: false, error: { code, message, issues? }, requestId }`. The global
   `onError` maps both `ApiError` and Effect tagged errors (`_tag`) to it.

4. **API module shape** (`apps/api`): `index.ts` (thin Elysia controller),
   `service.ts` (business logic), `error.ts` (`Schema.TaggedError`), `mapper.ts`
   (DB row → wire type).

5. **Web shape** (`apps/web`): `routes/` only holds route definitions; page content
   lives in `features/<name>/page.tsx` with `components/` + `hooks/`.

6. **Schemas are the contract.** `packages/shared` Effect Schemas drive Elysia
   validation, Eden types, frontend decoding, and OpenAPI docs — one source of truth.
