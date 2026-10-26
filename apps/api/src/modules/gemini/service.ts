import { InterviewPlanSchema, type Interview, type InterviewPlan } from "@repo/shared";
import { chat } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { env } from "../../config/env";
import { GeminiApiKeyMissingError, GeminiGenerationError, type GeminiError } from "./error";

/** Default Gemini model for structured plan generation. */
const MODEL = "gemini-3.8-flash" as const;

/** Builds the prompt that asks Gemini for a structured interview plan. */
export function buildPlanPrompt(interview: Interview): string {
  const lines = [
    "You are an expert technical interviewer. Generate a structured interview plan for the following role.",
    "",
    `Job position: ${interview.jobPosition}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    `Language: ${interview.language}`,
  ];

  if (interview.jobDescription) {
    lines.push("", "Job description:", interview.jobDescription);
  }

  if (interview.context) {
    lines.push("", "Context:", interview.context);
  }

  lines.push(
    "",
    "Produce 3-6 interview stages. Each stage must include a short name, an objective, 2-5 competencies, and 2-4 main questions.",
    "Each question needs text, 2-4 answer criteria, and a short scoring rubric.",
    `Respond in ${interview.language}.`,
  );

  return lines.join("\n");
}

const generateInterviewPlan = Effect.fn("GeminiService.generateInterviewPlan")(function* (
  interview: Interview,
): Effect.fn.Return<InterviewPlan, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: () =>
      chat({
        adapter: createGeminiChat(MODEL, apiKey.value),
        messages: [{ role: "user", content: buildPlanPrompt(interview) }],
        threadId: crypto.randomUUID(),
        outputSchema: Schema.toStandardSchemaV1(InterviewPlanSchema),
      }),
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
});

export class GeminiService extends Context.Service<
  GeminiService,
  {
    generateInterviewPlan(interview: Interview): Effect.Effect<InterviewPlan, GeminiError>;
  }
>()("ai-interview/gemini/GeminiService") {
  static readonly layer = Layer.succeed(GeminiService, GeminiService.of({ generateInterviewPlan }));
}
