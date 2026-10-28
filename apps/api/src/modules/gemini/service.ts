import {
  CvExtractionSchema,
  EvaluationReportSchema,
  InterviewPlanSchema,
  type CvExtraction,
  type CreateCvReview,
  type EvaluationCategory,
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

import { UNTRUSTED_DATA_RULE } from "./constants";
import {
  GeminiApiKeyMissingError,
  GeminiGenerationError,
  GeminiModelListError,
  type GeminiError,
} from "./error";
import { inlineLabel, wrapCandidateData } from "./utils";

/** Fails the effect as a Gemini error when the call outlives the configured timeout. */
function withGeminiTimeout<A>(
  effect: Effect.Effect<A, GeminiError>,
): Effect.Effect<A, GeminiError> {
  return effect.pipe(
    Effect.timeout(env.geminiTimeoutMs),
    Effect.catchTag("TimeoutError", () =>
      Effect.fail(new GeminiGenerationError({ message: "Gemini request timed out" })),
    ),
  );
}

/** Runs one Gemini request, mapping a thrown error or a timeout to `GeminiGenerationError`. */
export function geminiRequest<A>(run: () => Promise<A>): Effect.Effect<A, GeminiError> {
  return withGeminiTimeout(
    Effect.tryPromise({
      try: run,
      catch: (cause) => new GeminiGenerationError({ message: String(cause) }),
    }),
  );
}

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
export function buildPlanPrompt(
  interview: Interview,
  stages?: ReadonlyArray<StageSpec>,
  focus?: EvaluationCategory,
): string {
  const lines = [
    "You are an expert technical interviewer. Generate a structured interview plan for the following role.",
    UNTRUSTED_DATA_RULE,
    "",
    `Job position: ${inlineLabel(interview.jobPosition)}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    `Language: ${inlineLabel(interview.language)}`,
  ];

  if (interview.jobDescription) {
    lines.push(
      "",
      "Job description:",
      wrapCandidateData("job_description", interview.jobDescription),
    );
  }

  if (interview.context) {
    lines.push("", "Context:", wrapCandidateData("candidate_context", interview.context));
  }

  if (interview.cvText) {
    lines.push(
      "",
      "Candidate CV (background context; tailor the questions to the candidate's actual experience):",
      wrapCandidateData("candidate_cv", interview.cvText),
    );
  }

  if (stages && stages.length > 0) {
    lines.push(
      "",
      "Fill in the following stages (keep them in this exact order). Generate exactly the requested number of main questions for each stage.",
      "",
      ...stages.map(
        (stage, index) =>
          `${index + 1}. ${inlineLabel(stage.name)} — ${stage.mainQuestionCount} main question(s)`,
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

  if (focus) {
    lines.push(
      "",
      `This is focused practice on the candidate's weakest competency: ${focus.replaceAll("_", " ")}. Weight the questions toward it and probe it from multiple angles.`,
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
    UNTRUSTED_DATA_RULE,
    "",
    `Main question: ${inlineLabel(question)}`,
    "",
    "Candidate answer:",
    wrapCandidateData("candidate_answer", answer),
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
    UNTRUSTED_DATA_RULE,
    "",
    `Role: ${inlineLabel(interview.jobPosition)}`,
    `Experience level: ${interview.experienceLevel}`,
    `Difficulty: ${interview.difficulty}`,
    "",
    "Interview questions asked:",
    ...questions.map((question, index) => `${index + 1}. ${inlineLabel(question)}`),
    "",
    "Transcript:",
    wrapCandidateData("interview_transcript", transcript),
    "",
  ];

  if (interview.cvText) {
    lines.push("Candidate CV:", wrapCandidateData("candidate_cv", interview.cvText), "");
  }

  lines.push(
    "Evaluate the candidate's performance. Produce an overall score (1-100), a concise summary, key strengths, areas to improve, and learning recommendations.",
    "For every strength and every area to improve, return:",
    "- point: a short label, at most eight words",
    "- reason: one or two sentences explaining why, citing what the candidate said",
    "Also give a rubric score (1-5) with feedback for each competency category, referencing specific answers from the transcript.",
  );

  if (interview.cvText) {
    lines.push(
      "",
      "Highlight the CV: return 3-6 excerpts copied verbatim from the CV text above.",
      'Set kind to "strong" when the interview confirmed or supported the excerpt, and "weak" when it exposed a gap or an unproven claim.',
      "For each highlight, give a reason in one or two sentences.",
    );
  } else {
    lines.push("", "No CV was provided: return an empty cvHighlights array.");
  }

  lines.push(`Respond in ${interview.language}.`);

  return lines.join("\n");
}

/** Builds the prompt that asks Gemini to review a CV against a target role. */
export function buildCvReviewPrompt(input: CreateCvReview): string {
  const lines = [
    "You are an expert technical recruiter reviewing a candidate's CV for a specific role.",
    UNTRUSTED_DATA_RULE,
    "",
    `Role: ${inlineLabel(input.jobPosition)}`,
    `Experience level: ${input.experienceLevel}`,
  ];

  if (input.jobDescription) {
    lines.push("", "Job description:", wrapCandidateData("job_description", input.jobDescription));
  }

  lines.push("", "CV:", wrapCandidateData("candidate_cv", input.cvText), "");

  lines.push(
    "Review how well this CV fits the role. Produce an overall score (1-100), a concise summary, key strengths, areas to improve, and learning recommendations.",
    "For every strength and every area to improve, return:",
    "- point: a short label, at most eight words",
    "- reason: one or two sentences explaining why, citing the CV",
    "Score these competencies from 1-5 with feedback: technical_knowledge, relevance, depth, role_specific.",
    "",
    "Highlight the CV: return 3-6 excerpts copied verbatim from the CV text above. Do not paraphrase or change the punctuation inside a quote.",
    'Set kind to "strong" when the excerpt is concrete evidence that matches the role, and "weak" when it is vague, unsupported, or missing impact.',
    "For each highlight, give a reason in one or two sentences.",
    "",
    `Respond in ${input.language}.`,
  );

  return lines.join("\n");
}

/** Builds the prompt that asks Gemini to read a CV PDF as plain text. */
export function buildCvExtractionPrompt(): string {
  return [
    "You are reading a candidate's CV (PDF) so it can be used as context for a mock interview.",
    UNTRUSTED_DATA_RULE,
    "",
    "Return the readable text of the document as plain text, one item per line:",
    "- the name on its own line",
    "- the contact details on their own line",
    "- every section heading on its own line (Summary, Work Experience, Projects, Education, Skills, and so on)",
    "- every role or project header on its own line, including the organization and the dates",
    "- every role title and location on its own line",
    '- every bullet on its own line, starting with "- "',
    "- every TechStack line on its own line",
    "",
    "Put a newline between lines. Do not merge separate lines into one paragraph: the text is displayed as a document, so line breaks matter.",
    "Keep the original wording. Do not summarize, invent, or reorder sections.",
    "If the document is not a CV, still return its readable text with the same line structure.",
  ].join("\n");
}

const generateInterviewPlan = Effect.fn("GeminiService.generateInterviewPlan")(function* (
  interview: Interview,
  stages?: ReadonlyArray<StageSpec>,
  focus?: EvaluationCategory,
): Effect.fn.Return<InterviewPlan, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* geminiRequest(() =>
    chat({
      adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
      messages: [{ role: "user", content: buildPlanPrompt(interview, stages, focus) }],
      threadId: crypto.randomUUID(),
      outputSchema: Schema.toStandardJSONSchemaV1(InterviewPlanSchema),
      retry: { maxRetries: 1 },
    }),
  );
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

  return yield* geminiRequest(async () => {
    const { text } = await chat({
      adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
      messages: [{ role: "user", content: buildFollowUpPrompt(interview, question, answer) }],
      threadId: crypto.randomUUID(),
      stream: false,
      retry: { maxRetries: 1 },
    });

    return text;
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

  return yield* geminiRequest(() =>
    chat({
      adapter: createGeminiChat(interview.model as GeminiTextModel, apiKey.value),
      messages: [
        { role: "user", content: buildEvaluationPrompt(interview, questions, transcript) },
      ],
      threadId: crypto.randomUUID(),
      outputSchema: Schema.toStandardJSONSchemaV1(EvaluationReportSchema),
      retry: { maxRetries: 1 },
    }),
  );
});

const generateCvReview = Effect.fn("GeminiService.generateCvReview")(function* (
  input: CreateCvReview,
): Effect.fn.Return<EvaluationReport, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* geminiRequest(() =>
    chat({
      adapter: createGeminiChat(
        (input.model ?? "gemini-3.8-flash") as GeminiTextModel,
        apiKey.value,
      ),
      messages: [{ role: "user", content: buildCvReviewPrompt(input) }],
      threadId: crypto.randomUUID(),
      outputSchema: Schema.toStandardJSONSchemaV1(EvaluationReportSchema),
      retry: { maxRetries: 1 },
    }),
  );
});

const extractCv = Effect.fn("GeminiService.extractCv")(function* (
  pdfBase64: string,
  model: string,
): Effect.fn.Return<CvExtraction, GeminiError> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  return yield* geminiRequest(() =>
    chat({
      adapter: createGeminiChat(model as GeminiTextModel, apiKey.value),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", content: buildCvExtractionPrompt() },
            {
              type: "document",
              source: {
                type: "data",
                value: pdfBase64,
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      threadId: crypto.randomUUID(),
      outputSchema: Schema.toStandardJSONSchemaV1(CvExtractionSchema),
      retry: { maxRetries: 1 },
    }),
  );
});

const listModels = Effect.fn("GeminiService.listModels")(function* (): Effect.fn.Return<
  ReadonlyArray<GeminiModel>,
  GeminiError
> {
  const apiKey = env.geminiApiKey;
  if (Option.isNone(apiKey)) {
    return yield* new GeminiApiKeyMissingError();
  }

  const response = yield* geminiRequest(() =>
    // The key goes in a header, never the URL, so it cannot surface in logs or errors.
    fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey.value },
      signal: AbortSignal.timeout(env.geminiModelsTimeoutMs),
    }),
  );

  if (!response.ok) {
    return yield* new GeminiModelListError({
      message: `Failed to list models: ${response.status}`,
    });
  }

  const body = yield* geminiRequest(
    () =>
      response.json() as Promise<{
        models?: Array<{
          name: string;
          displayName: string;
          description: string;
          supportedGenerationMethods?: string[];
        }>;
      }>,
  );

  return (body.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => ({
      name: model.name.replace(/^models\//, ""),
      displayName: model.displayName,
      description: model.description,
    }));
});

export interface IGeminiService {
  generateInterviewPlan(
    interview: Interview,
    stages?: ReadonlyArray<StageSpec>,
    focus?: EvaluationCategory,
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
  generateCvReview(input: CreateCvReview): Effect.Effect<EvaluationReport, GeminiError>;
  extractCv(pdfBase64: string, model: string): Effect.Effect<CvExtraction, GeminiError>;
  listModels(): Effect.Effect<ReadonlyArray<GeminiModel>, GeminiError>;
}

export class GeminiService extends Context.Service<GeminiService, IGeminiService>()(
  "ai-interview/gemini/GeminiService",
) {
  static readonly layer = Layer.succeed(
    GeminiService,
    GeminiService.of({
      generateInterviewPlan,
      generateFollowUp,
      generateEvaluation,
      generateCvReview,
      extractCv,
      listModels,
    }),
  );
}
