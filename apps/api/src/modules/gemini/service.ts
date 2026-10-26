import {
  InterviewPlanSchema,
  type Interview,
  type InterviewPlan,
  type StageSpec,
} from "@ai-interview/shared";
import { chat } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { env } from "@/config/env";

import { GeminiApiKeyMissingError, GeminiGenerationError, type GeminiError } from "./error";

/** Default Gemini model for structured plan generation. */
const MODEL = "gemini-3.8-flash" as const;

/** Builds the prompt that asks Gemini for a structured interview plan. */
export function buildPlanPrompt(interview: Interview, stages?: ReadonlyArray<StageSpec>): string {
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

  if (stages && stages.length > 0) {
    lines.push(
      "",
      "Fill in the following stages (keep them in this exact order). Generate exactly the requested number of main questions for each stage.",
      "",
      ...stages.map(
        (stage, index) =>
          `${index + 1}. ${stage.name} — ${stage.mainQuestionCount} main question(s)`,
      ),
      "",
      "For each stage, write an objective and 2-5 competencies, then the requested questions.",
    );
  } else {
    lines.push(
      "",
      "Produce 3-6 interview stages. Each stage must include a short name, an objective, 2-5 competencies, and 2-4 main questions.",
    );
  }

  if (interview.strictMode) {
    lines.push(
      "",
      "Interviewer style: strict. Be direct, challenge weak or vague answers, and do not give hints or lead the candidate.",
    );
  }

  if (interview.allowFollowUps) {
    lines.push(
      "",
      "Dynamic follow-up questions are allowed: write open-ended main questions that naturally invite follow-ups.",
    );
  }

  lines.push(
    "Each question needs text, 2-4 answer criteria, and a short scoring rubric.",
    `Respond in ${interview.language}.`,
  );

  return lines.join("\n");
}

/** Builds the prompt that asks Gemini for a single follow-up question. */
export function buildFollowUpPrompt(
  interview: Interview,
  question: string,
  answer: string,
): string {
  const lines = [
    "You are an expert technical interviewer conducting a live interview.",
    "",
    `Main question: ${question}`,
    "",
    `Candidate answer: ${answer}`,
    "",
    "Ask ONE probing follow-up question that digs into a gap, a shallow point, or an unverified claim in the answer.",
  ];

  if (interview.strictMode) {
    lines.push("Be direct and challenge the answer without giving hints.");
  }

  lines.push(`Respond in ${interview.language} with only the follow-up question.`);

  return lines.join("\n");
}

const generateInterviewPlan = Effect.fn("GeminiService.generateInterviewPlan")(function* (
  interview: Interview,
  stages?: ReadonlyArray<StageSpec>,
): Effect.fn.Return<InterviewPlan, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: () =>
      chat({
        adapter: createGeminiChat(MODEL, apiKey.value),
        messages: [{ role: "user", content: buildPlanPrompt(interview, stages) }],
        threadId: crypto.randomUUID(),
        outputSchema: Schema.toStandardSchemaV1(InterviewPlanSchema),
      }),
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
});

const generateFollowUp = Effect.fn("GeminiService.generateFollowUp")(function* (
  interview: Interview,
  question: string,
  answer: string,
): Effect.fn.Return<string, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: async () => {
      const { text } = await chat({
        adapter: createGeminiChat(MODEL, apiKey.value),
        messages: [{ role: "user", content: buildFollowUpPrompt(interview, question, answer) }],
        threadId: crypto.randomUUID(),
        stream: false,
      });

      return text;
    },
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
});

export class GeminiService extends Context.Service<
  GeminiService,
  {
    generateInterviewPlan(
      interview: Interview,
      stages?: ReadonlyArray<StageSpec>,
    ): Effect.Effect<InterviewPlan, GeminiError>;
    generateFollowUp(
      interview: Interview,
      question: string,
      answer: string,
    ): Effect.Effect<string, GeminiError>;
  }
>()("ai-interview/gemini/GeminiService") {
  static readonly layer = Layer.succeed(
    GeminiService,
    GeminiService.of({ generateInterviewPlan, generateFollowUp }),
  );
}
