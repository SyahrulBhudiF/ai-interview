import {
  CvExtractionSchema,
  EvaluationReportSchema,
  GeminiModelListResponseSchema,
  InterviewPlanSchema,
  type CvExtraction,
  type CreateCvReview,
  type EvaluationCategory,
  type EvaluationReport,
  type GeminiModel,
  type Interview,
  type InterviewPlan,
  type StageSpec,
} from "@ai-interview/shared";
import { chat } from "@tanstack/ai";
import { createGeminiChat, type GeminiTextModel } from "@tanstack/ai-gemini";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { env } from "@/config/env";

import {
  GeminiApiKeyMissingError,
  GeminiGenerationError,
  GeminiModelListError,
  type GeminiError,
} from "./error";
import {
  buildCvExtractionPrompt,
  buildCvReviewPrompt,
  buildEvaluationPrompt,
  buildFollowUpPrompt,
  buildPlanPrompt,
} from "./prompt";

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

  const body = yield* geminiRequest(() => response.json() as Promise<unknown>);

  const parsed = yield* Schema.decodeUnknownEffect(GeminiModelListResponseSchema)(body).pipe(
    Effect.mapError(() => new GeminiModelListError({ message: "Unexpected models list response" })),
  );

  return (parsed.models ?? [])
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
