import { ApiSuccessSchema, GreetRequestSchema, GreetResponseSchema } from "@repo/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "../../libs/response";
import * as service from "./service";

export const greet = new Elysia({ prefix: "/api", tags: ["Greet"] }).post(
  "/greet",
  {
    body: Schema.toStandardSchemaV1(GreetRequestSchema),
    response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(GreetResponseSchema)) },
    detail: { summary: "Greet a name", description: "Returns a greeting for the given name." },
  },
  ({ body }) => ok(service.greet(body)),
);
