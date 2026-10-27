import {
  EvaluationReportSchema,
  InterviewPlanSchema,
  type EvaluationReport,
  type GeminiModel,
  type Interview,
  type InterviewPlan,
  type Persona,
  type StageSpec,
} from "@ai-interview/shared";
import { chat } from "@tanstack/ai";
import { createGeminiChat, type GeminiTextModel } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { env } from "@/config/env";

import { GeminiApiKeyMissingError, GeminiGenerationError, type GeminiError } from "./error";

/** Interviewer persona → system-prompt style line. */
export function personaSystemPrompt(persona: Persona): string {
  switch (persona) {
    case "friendly":
      return "Interviewer style: warm and encouraging, but still thorough.";
    case "socratic":
      return "Interviewer style: Socratic — ask probing follow-up 'why' questions to uncover depth.";
    case "fast_paced":
      return "Interviewer style: fast-paced — keep questions concise and move quickly.";
    case "professional":
      return "Interviewer style: professional and balanced.";
  }
}

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

  lines.push("", personaSystemPrompt(interview.persona));

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

/** Builds the prompt that asks Gemini to evaluate a completed interview. */
export function buildEvaluationPrompt(
  interview: Interview,
  questions: ReadonlyArray<string>,
  transcript: string,
): string {
  const lines = [
    "You are an expert technical interviewer evaluating a completed mock interview.",
    "",
    `Role: ${interview.jobPosition}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    "",
    "Interview questions asked:",
    ...questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "Transcript:",
    transcript,
    "",
    "Evaluate the candidate's performance. Produce an overall score (1-100), a concise summary, key strengths, areas to improve, and learning recommendations.",
    "Also give a rubric score (1-5) with feedback for each competency category, referencing specific answers from the transcript.",
    `Respond in ${interview.language}.`,
  ];

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
        adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
        messages: [{ role: "user", content: buildPlanPrompt(interview, stages) }],
        threadId: crypto.randomUUID(),
        outputSchema: Schema.toStandardJSONSchemaV1(InterviewPlanSchema),
        retry: { maxRetries: 1 },
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
        adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
        messages: [{ role: "user", content: buildFollowUpPrompt(interview, question, answer) }],
        threadId: crypto.randomUUID(),
        stream: false,
        retry: { maxRetries: 1 },
      });

      return text;
    },
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
});

const generateEvaluation = Effect.fn("GeminiService.generateEvaluation")(function* (
  interview: Interview,
  questions: ReadonlyArray<string>,
  transcript: string,
): Effect.fn.Return<EvaluationReport, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: () =>
      chat({
        adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
        messages: [
          { role: "user", content: buildEvaluationPrompt(interview, questions, transcript) },
        ],
        threadId: crypto.randomUUID(),
        outputSchema: Schema.toStandardJSONSchemaV1(EvaluationReportSchema),
        retry: { maxRetries: 1 },
      }),
    catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
  });
});

const listModels = Effect.fn("GeminiService.listModels")(function* (): Effect.fn.Return<
  ReadonlyArray<GeminiModel>,
  GeminiError
> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.value}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const body = (await response.json()) as {
        models?: Array<{
          name: string;
          displayName: string;
          description: string;
          supportedGenerationMethods?: string[];
        }>;
      };

      return (body.models ?? [])
        .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
        .map((model) => ({
          name: model.name.replace(/^models\//, ""),
          displayName: model.displayName,
          description: model.description,
        }));
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
    generateEvaluation(
      interview: Interview,
      questions: ReadonlyArray<string>,
      transcript: string,
    ): Effect.Effect<EvaluationReport, GeminiError>;
    listModels(): Effect.Effect<ReadonlyArray<GeminiModel>, GeminiError>;
  }
>()("ai-interview/gemini/GeminiService") {
  static readonly layer = Layer.succeed(
    GeminiService,
    GeminiService.of({ generateInterviewPlan, generateFollowUp, generateEvaluation, listModels }),
  );
}
