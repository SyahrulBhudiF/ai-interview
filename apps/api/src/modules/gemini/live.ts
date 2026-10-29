import type { Interview } from "@ai-interview/shared";
import { Behavior, Modality } from "@google/genai";
import { realtimeToken, type RealtimeToken } from "@tanstack/ai";
import { geminiRealtimeToken } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option } from "effect";

import { env } from "@/config/env";

import { GeminiApiKeyMissingError, GeminiGenerationError, type GeminiError } from "./error";
import { personaSystemPrompt } from "./service";

/** Default low-latency Gemini Live voice model. */
const MODEL = "gemini-3.8-live" as const;

/** Builds the system prompt that turns Gemini Live into this interview's interviewer. */
export function buildInterviewerInstructions(interview: Interview, question: string): string {
  const lines = [
    "You are conducting a live voice interview for a mock-interview platform.",
    `Role: ${interview.jobPosition}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    "",
    `Current question: ${question}`,
    "Read the current question aloud, then listen. Ask only one question at a time.",
    "You are the voice of the interviewer. The submit_answer tool controls the interview plan.",
    "After the candidate finishes an answer, call submit_answer with no arguments and wait for its result.",
    "The tool saves the original speech transcript and returns the next interviewerMessage. Read it aloud verbatim.",
    "Never invent the next question or advance without a successful tool result. Do not grade or coach during the interview.",
    "A short pause is thinking time, not necessarily the end of an answer. Let the candidate finish.",
    "If they ask you to repeat or clarify, help briefly without submitting their answer.",
    "If the tool returns finished, say its closing message and do not ask another question.",
    "If saving fails, stop and let the candidate use the retry control. Never claim an unsaved answer was saved.",
  ];

  if (interview.cvText) {
    lines.push("", "Candidate CV (context for follow-ups):", interview.cvText);
  }

  if (interview.allowFollowUps) {
    lines.push(
      "Follow-up questions are supplied by submit_answer. Do not add your own follow-ups.",
    );
  } else {
    lines.push("Do not ask follow-ups; wrap up this question after the answer.");
  }

  if (interview.strictMode) {
    lines.push("Be strict: challenge weak answers and give no hints.");
  }

  lines.push(
    personaSystemPrompt(interview.persona),
    `Speak in ${interview.language}.`,
    "Keep responses conversational and concise for voice.",
  );

  return lines.join("\n");
}

const createRealtimeToken = Effect.fn("GeminiLiveService.createRealtimeToken")(function* (
  interview: Interview,
  question: string,
): Effect.fn.Return<RealtimeToken, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: () =>
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
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
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
