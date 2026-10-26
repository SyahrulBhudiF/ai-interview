# AGENTS.md — apps/web

TanStack Start + TanStack Query + TanStack Form + shadcn.

## Routing vs features

- `src/routes/` contains **only** file-route definitions (`createFileRoute`), which
  import their page from `features/`. No page/component/logic lives in `routes/`.
- `src/features/<name>/` holds everything for a page:

```text
features/<name>/
├── page.tsx       the route's page — composes sections
├── components/    presentational JSX (uses hooks)
└── hooks/         data/form logic (TanStack Query/Form, Eden calls)
```

- One feature per route/page. Cross-cutting UI goes in `src/components/` or
  `@ai-interview/ui` (shadcn).

## Data & API

- Eden client in `src/lib/eden.ts` (`treaty<App>`). Client calls are same-origin
  through the Vite proxy; server-side calls go to `http://localhost:3001`.
- Decode Eden responses at the boundary with the shared Effect Schemas
  (`Schema.decodeUnknownSync(ApiSuccessSchema(...))(data).data`) — one schema,
  same as the API.
- TanStack Query owns the cache; `src/lib/query-client.ts` is the singleton factory.
- Forms use `@tanstack/react-form` (see `features/home/hooks/use-greet-form.ts`).

## UI

- Import shadcn components from `@ai-interview/ui/<name>` (new-york, Tailwind v4).
- `cn` from `@ai-interview/ui/utils`. Theme CSS in `src/styles/globals.css`.
