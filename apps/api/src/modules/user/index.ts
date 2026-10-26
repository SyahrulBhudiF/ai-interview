import { ApiSuccessSchema, UserSchema } from "@repo/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { UserService } from "./service";

export const user = new Elysia({ prefix: "/api", tags: ["User"] }).get(
  "/users",
  {
    response: {
      200: Schema.toStandardSchemaV1(ApiSuccessSchema(Schema.Array(UserSchema))),
    },
    detail: {
      summary: "List users",
      description: "Returns all users.",
    },
  },
  async () => ok(await runtime.runPromise(UserService.use((service) => service.listUsers()))),
);
