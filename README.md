# ai-interview

Monorepo for the AI Interview product. Turborepo + Bun workspaces.

## Stack

| Concern     | Choice                                          |
| ----------- | ----------------------------------------------- |
| Monorepo    | Turborepo + Bun workspaces                      |
| Web         | TanStack Start + TanStack Query + TanStack Form |
| API         | Elysia 2 (Kiana, `2.0.0-rc.0`) + Effect v4      |
| API client  | Eden Treaty (`@elysia/eden`), fully typed       |
| Schemas     | Effect Schema (`Schema.*`) in `packages/shared` |
| UI          | shadcn/ui (new-york) in `packages/components`   |
| ORM         | Drizzle + PostgreSQL                            |
| Logging     | Effect `Logger` (structured, `ManagedRuntime`)  |
| Docs        | Scalar (OpenAPI) at `/openapi`                  |
| Lint/format | oxlint + oxfmt (+ Vite+ `vp`)                   |
| Local dev   | devenv (Nix) + direnv                           |

## Layout

```text
apps/
  api/              Elysia API — modules/{greet,health,user}
  web/              TanStack Start web app — routes/ + features/home
packages/
  components/       shadcn/ui (@repo/components)
  shared/           Effect Schema contracts (@repo/shared)
  typescript-config/
.agents/            CONTEXT.md + reusable skills
```

## Getting started

```bash
devenv up              # starts Postgres and drops you in the dev shell
bun install            # installs dependencies (bun.lock)
bun run dev            # runs web + api in parallel (Turbo)
```

- Web: http://localhost:3000 (proxies `/api` → http://localhost:3001)
- API: http://localhost:3001
- API docs (Scalar): http://localhost:3001/openapi

## Scripts

```bash
bun run dev              # run everything
bun run dev --filter web
bun run dev --filter api
bun run build            # build all
bun run check-types      # tsc across the monorepo
bun run test             # vitest across the monorepo
bun run lint             # oxlint
bun run lint:fix         # oxlint --fix
bun run fmt              # oxfmt
bun run fmt:check        # oxfmt --check

# one-batch verification
.agents/skills/verifying-ai-interview/scripts/checks.sh

# inside apps/api
bun run --filter api db:generate
bun run --filter api db:migrate
bun run --filter api db:studio
```

## Conventions

- **Response envelope**: every API response is `{ ok: true, data }` on success or
  `{ ok: false, error: { code, message, issues? }, requestId }` on failure.
- **Effect where it earns its keep**: pure logic is a plain function; use
  `Context.Service` + `Layer` + `ManagedRuntime` only for real effects (async,
  typed errors, resources, dependencies).
- **`yield*` inside Effect, `await` only at the boundary** (Elysia handler).
- **API modules** (`apps/api/src/modules/<name>/`): `index.ts` (thin controller),
  `service.ts`, `error.ts` (`Schema.TaggedError`), `mapper.ts` (row → wire type).
- **Web features** (`apps/web/src/features/<name>/`): `routes/` holds only route
  definitions; pages live in `page.tsx` with `components/` + `hooks/`.
- **Schemas are the contract**: `packages/shared` Effect Schemas drive Elysia
  validation, Eden types, frontend decoding, and OpenAPI — one source of truth.
- Wire timestamps are ISO strings, never `Date`.

## Agent guidance

Every package has its own `AGENTS.md`; `.agents/CONTEXT.md` records the
architecture decisions; `.agents/skills/` ships reusable skills
(`building-api-modules`, `building-web-features`, `verifying-ai-interview`).
