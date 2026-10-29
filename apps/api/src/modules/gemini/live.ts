import type { Interview } from "@ai-interview/shared";
import { Behavior, Modality } from "@google/genai";
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
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: { silenceDurationMs: 1500 },
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "submit_answer",
                    behavior: Behavior.BLOCKING,
                    description:
                      "Save the candidate's completed spoken answer and get the next question. Call once per answer, never for a request to repeat or clarify.",
                    parametersJsonSchema: {
                      type: "object",
                      properties: {},
                      additionalProperties: false,
                    },
                  },
                ],
              },
            ],
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
