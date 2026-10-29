import { ApiSuccessSchema, CvExtractionSchema, ExtractCvRequestSchema } from "@ai-interview/shared";
import { Schema } from "effect";
import { Elysia } from "elysia";

import { ok } from "@/libs/response";
import { runtime } from "@/runtime";

import { InvalidCvFileError } from "./error";
import { CvService } from "./service";
import { isPdf } from "./validation";

export const cv = new Elysia({ prefix: "/api", tags: ["CV"] }).post(
  "/cv/extract",
  {
    body: Schema.toStandardSchemaV1(ExtractCvRequestSchema),
    response: { 200: Schema.toStandardSchemaV1(ApiSuccessSchema(CvExtractionSchema)) },
    detail: {
      summary: "Extract CV text",
      description: "Reads a PDF CV with Gemini and returns its text as interview context.",
    },
  },
  async ({ body }) => {
    const data = new Uint8Array(await body.file.arrayBuffer());

    // The MIME header is only a hint; the bytes must carry the PDF signature.
    if (!isPdf(data)) throw new InvalidCvFileError();

    return ok(
      await runtime.runPromise(
        CvService.use((service) => service.extract({ data, model: body.model })),
      ),
    );
  },
);
