import type { CvExtraction } from "@ai-interview/shared";
import { Context, Effect, Layer } from "effect";

import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";

export interface ICvService {
  /** Accepts bytes the HTTP boundary has already validated. */
  extract(input: { data: Uint8Array; model?: string }): Effect.Effect<CvExtraction, GeminiError>;
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
        return yield* gemini.extractCv(
          Buffer.from(input.data).toString("base64"),
          input.model ?? "gemini-3.8-flash",
        );
      });

      return CvService.of({ extract });
    }),
  );
}
