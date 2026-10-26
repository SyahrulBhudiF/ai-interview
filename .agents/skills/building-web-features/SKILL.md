---
name: building-web-features
description: Adds or changes a TanStack Start web feature following the thin-routes + features/<name>/{page,components,hooks} layout, the Eden client, and shadcn conventions. Use when creating or editing a page in apps/web.
---

# Building web features

TanStack Start + Query + Form + shadcn. Read `apps/web/AGENTS.md` first — it is
the authoritative rule set.

## Layout

- `src/routes/` holds **only** file-route definitions (`createFileRoute`) that
  import their page from `features/`. No page/component/logic lives in `routes/`.
- `src/features/<name>/` holds everything for one page:

```text
features/<name>/
├── page.tsx       the route's page — composes sections
├── components/    presentational JSX (uses hooks)
└── hooks/         data/form logic (TanStack Query/Form, Eden calls)
```

Reference: `features/home/` (page + `components/health.tsx`,
`components/greet-form.tsx`, `hooks/use-health.ts`, `hooks/use-greet-form.ts`).

## Steps for a new feature/page

1. Create `features/<name>/` with `hooks/`, `components/`, `page.tsx`.
2. Put data fetching in a hook (`useQuery` + Eden from `lib/eden.ts`); decode the
   Eden response at the boundary with the shared Effect Schema
   (`Schema.decodeUnknownSync(ApiSuccessSchema(...))(data).data`).
3. Put form logic in a hook (`@tanstack/react-form`).
4. Put presentation in `components/`, importing shadcn from
   `@repo/components/<name>` (new-york, Tailwind v4).
5. In `routes/`, add a thin route that imports the page:

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { SomePage } from "@/features/<name>/page";

export const Route = createFileRoute("/path")({ component: SomePage });
```

## Rules that are easy to miss

- `routes/` stays thin — no JSX beyond the route definition.
- One feature per route/page; cross-cutting UI goes in `src/components/` or
  `@repo/components`.
- Eden client calls are same-origin through the Vite proxy in dev.
- Reuse the shared Effect Schemas for decoding — never inline duplicate
  validation.
