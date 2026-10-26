# AGENTS.md — packages/components

shadcn/ui components (new-york style, Tailwind v4), consumed as TypeScript source.

- One component per file in `src/`, re-exported from `src/index.ts`.
- Radix primitives come from the unified `radix-ui` package, used as namespaces:
  `Slot.Slot`, `Separator.Root`, `Label.Root`.
- Class variants via `class-variance-authority` + `cn` from `./utils`.
- Use `data-slot` attributes and the shadcn Tailwind v4 class strings verbatim.
- Add components with the shadcn CLI (`components.json` at the repo root of this
  package) so aliases stay in sync; `ui` alias → `@repo/components`.
- No build step — check-types is `tsc --noEmit`; consumers transpile the `.tsx`.
