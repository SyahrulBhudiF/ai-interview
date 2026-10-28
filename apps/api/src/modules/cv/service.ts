import type { CvExtraction } from "@ai-interview/shared";
import { Context, Effect, Layer } from "effect";

import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";

import { InvalidCvFileError } from "./error";

/** The form caps uploads at 10MB; the service checks again before sending it on. */
export const MAX_CV_BYTES = 10 * 1024 * 1024;

/** Whether the bytes carry the PDF signature (`%PDF-`). */
export function isPdf(data: Uint8Array): boolean {
  return (
    data.length >= 5 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46 &&
    data[4] === 0x2d
  );
}

export interface ICvService {
  extract(input: {
    data: Uint8Array;
    model?: string;
  }): Effect.Effect<CvExtraction, InvalidCvFileError | GeminiError>;
}

export class CvService extends Context.Service<CvService, ICvService>()(
  "ai-interview/cv/CvService",
) {
  static readonly layer = Layer.effect(
    CvService,
    Effect.gen(function* () {
      const gemini = yield* GeminiService;

      const extract = Effect.fn("CvService.extract")(function* (input: {
        data: Uint8Array;
        model?: string;
      }) {
        if (input.data.length === 0) {
          return yield* new InvalidCvFileError({ message: "The file is empty." });
        }

        if (input.data.length > MAX_CV_BYTES) {
          return yield* new InvalidCvFileError({ message: "The file is larger than 10MB." });
        }

        if (!isPdf(input.data)) {
          return yield* new InvalidCvFileError({ message: "The file is not a PDF." });
        }

        return yield* gemini.extractCv(
          Buffer.from(input.data).toString("base64"),
          input.model ?? "gemini-3.8-flash",
        );
      });

      return CvService.of({ extract });
    }),
  );
}
