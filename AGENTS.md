# AGENTS.md

Operational guide for AI agents working in this monorepo. Read before editing. Each
package also has its own `AGENTS.md`; follow the one closest to the file you change.

## Stack

| Concern     | Choice                                        |
| ----------- | --------------------------------------------- |
| Monorepo    | Turborepo + Bun workspaces                    |
| Package mgr | Bun (`bun install`, `bun.lock`)               |
| Web         | TanStack Start + Query + Form                 |
| API         | Elysia 2 (`2.0.0-rc.0`, "Kiana") + Effect v4  |
| Schemas     | Effect Schema in `packages/shared`            |
| UI          | shadcn/ui (new-york) in `packages/components` |
| ORM         | Drizzle + PostgreSQL                          |
| Lint/format | oxlint + oxfmt (+ vite-plus `vp`)             |
| Local dev   | devenv (Nix) + direnv                         |

## Layout

```text
apps/
  api/            Elysia API (Effect v4)
  web/            TanStack Start web app
packages/
  components/     shadcn/ui (@ai-interview/ui)
  shared/         Effect Schema contracts (@ai-interview/shared)
  typescript-config/
.agents/CONTEXT.md  architecture decisions & domain context
```

## Commands

```bash
devenv up            # Postgres + dev shell
bun install
bun run dev          # web + api in parallel
bun run check-types
bun run test
bun run lint / lint:fix
bun run fmt / fmt:check
bun run build
```

## Non-negotiable conventions

- **Response envelope**: every API response is `{ ok: true, data }` on success or
  `{ ok: false, error: { code, message, issues? }, requestId }` on failure. Never
  return bare payloads.
- **Effect where it earns its keep**: pure logic is a plain function. Use
  `Effect` (and `Context.Service` + `Layer` + `ManagedRuntime`) only for real
  effects — async work, typed errors, resources, dependencies, concurrency.
- **`yield*` inside Effect, `await` only at the boundary** (Elysia handler,
  `runtime.runPromise` / `runtime.runSync`).
- **Schemas live in `packages/shared`** as Effect Schemas. The API exposes them to
  Elysia via `Schema.toStandardSchemaV1(...)`; the web decodes Eden responses with
  the same schemas.
- Wire timestamps are ISO strings, never `Date`.

See `apps/api/AGENTS.md` and `apps/web/AGENTS.md` for the module layout rules.
