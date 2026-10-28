import type { Interview } from "@ai-interview/shared";
import { realtimeToken, type RealtimeToken } from "@tanstack/ai";
import { geminiRealtimeToken } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option } from "effect";

import { env } from "@/config/env";

import { GeminiApiKeyMissingError, type GeminiError } from "./error";
import { buildInterviewerInstructions } from "./prompt";
import { geminiRequest } from "./service";

/** Default low-latency Gemini Live voice model. */
const MODEL = "gemini-3.8-live" as const;

const createRealtimeToken = Effect.fn("GeminiLiveService.createRealtimeToken")(function* (
  interview: Interview,
  question: string,
): Effect.fn.Return<RealtimeToken, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* geminiRequest(() =>
    realtimeToken({
      adapter: geminiRealtimeToken({
        liveConnectConstraints: {
          model: MODEL,
          config: {
            systemInstruction: {
              parts: [{ text: buildInterviewerInstructions(interview, question) }],
            },
          },
        },
      }),
    }),
  );
});

export interface IGeminiLiveService {
  createRealtimeToken(
    interview: Interview,
    question: string,
  ): Effect.Effect<RealtimeToken, GeminiError>;
}

export class GeminiLiveService extends Context.Service<GeminiLiveService, IGeminiLiveService>()(
  "ai-interview/gemini/GeminiLiveService",
) {
  static readonly layer = Layer.succeed(
    GeminiLiveService,
    GeminiLiveService.of({ createRealtimeToken }),
  );
}
