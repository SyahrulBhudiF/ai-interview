# AGENTS.md — packages/shared

Single source of truth for wire/request/response contracts, as **Effect Schemas**.

- Only Effect `Schema` here — never domain logic, Drizzle types, or HTTP code.
- One file per domain (`api.ts`, `user.ts`, …), re-exported from `src/index.ts`.
- Short schema names matching the wire type (`UserSchema`, `GreetRequestSchema`).
- Wire timestamps are ISO strings (`Schema.String`), never `Date`.
- The success/error envelope lives in `api.ts`: `ApiSuccessSchema` + `ApiErrorResponseSchema`.
- Export both the schema and its type:

```ts
export const UserSchema = Schema.Struct({ ... });
export type User = Schema.Schema.Type<typeof UserSchema>;
```

- The API passes schemas to Elysia via `Schema.toStandardSchemaV1(schema)`; the web
  decodes responses with `Schema.decodeUnknownSync` / `Schema.decodeUnknownEffect`.
