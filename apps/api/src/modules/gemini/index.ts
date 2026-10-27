import { ApiSuccessSchema, GeminiModelSchema } from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { GeminiService } from "./service";

export const gemini = new Elysia({ prefix: "/api", tags: ["Gemini"] }).get(
  "/models",
  {
    response: {
      200: Schema.toStandardSchemaV1(ApiSuccessSchema(Schema.Array(GeminiModelSchema))),
    },
    detail: {
      summary: "List Gemini models",
      description: "Returns Gemini models that support text generation, with descriptions.",
    },
  },
  async () => ok(await runtime.runPromise(GeminiService.use((service) => service.listModels()))),
);
