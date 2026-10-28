import type { Interview } from "@ai-interview/shared";
import { realtimeToken, type RealtimeToken } from "@tanstack/ai";
import { geminiRealtimeToken } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option } from "effect";

import { env } from "@/config/env";

import { GeminiApiKeyMissingError, type GeminiError } from "./error";
import {
  geminiRequest,
  inlineLabel,
  personaSystemPrompt,
  UNTRUSTED_DATA_RULE,
  wrapCandidateData,
} from "./service";

/** Default low-latency Gemini Live voice model. */
const MODEL = "gemini-3.8-live" as const;

/** Builds the system prompt that turns Gemini Live into this interview's interviewer. */
export function buildInterviewerInstructions(interview: Interview, question: string): string {
  const lines = [
    "You are conducting a live voice interview for a mock-interview platform.",
    UNTRUSTED_DATA_RULE,
    `Role: ${inlineLabel(interview.jobPosition)}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    "",
    `Current question: ${inlineLabel(question)}`,
    "Ask the question conversationally, then listen to the candidate's answer.",
  ];

  if (interview.cvText) {
    lines.push(
      "",
      "Candidate CV (context for follow-ups):",
      wrapCandidateData("candidate_cv", interview.cvText),
    );
  }

  if (interview.allowFollowUps) {
    lines.push("You may ask one or two short follow-ups to dig into shallow or vague answers.");
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
