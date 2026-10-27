import { ApiSuccessSchema, ProgressSchema } from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { ProgressService } from "./service";

export const progress = new Elysia({ prefix: "/api", tags: ["Progress"] }).get(
  "/progress",
  {
    response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(ProgressSchema)) },
    detail: {
      summary: "Get interview progress",
      description:
        "Returns score history and competency averages across the evaluated sessions, newest first.",
    },
  },
  async () => ok(await runtime.runPromise(ProgressService.use((service) => service.getProgress()))),
);
