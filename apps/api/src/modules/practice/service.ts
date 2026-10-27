import type { EvaluationCategory, Interview } from "@ai-interview/shared";
import { Context, Effect, Layer } from "effect";

import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";
import type { InterviewNotFoundError } from "@/modules/interview/error";
import { InterviewPlanService } from "@/modules/interview/plan/service";
import { InterviewService } from "@/modules/interview/service";

export interface IPracticeService {
  createPracticeInterview(
    category: EvaluationCategory,
  ): Effect.Effect<Interview, GeminiError | InterviewNotFoundError>;
}

export class PracticeService extends Context.Service<PracticeService, IPracticeService>()(
  "ai-interview/practice/PracticeService",
) {
  static readonly layer = Layer.effect(
    PracticeService,
    Effect.gen(function* () {
      const interviewService = yield* InterviewService;
      const planService = yield* InterviewPlanService;
      const geminiService = yield* GeminiService;

      const createPracticeInterview = Effect.fn("PracticeService.createPracticeInterview")(
        function* (category: EvaluationCategory) {
          const label = category.replaceAll("_", " ");

          const interview = yield* interviewService.createInterview({
            title: `Practice: ${label}`,
            jobPosition: "Practice session",
            experienceLevel: "mid",
            language: "en",
            difficulty: "intermediate",
            context: `Focused practice on ${label}, the candidate's weakest competency.`,
          });

          const plan = yield* geminiService.generateInterviewPlan(
            interview,
            [{ name: `${label} practice`, mainQuestionCount: 3 }],
            category,
          );

          yield* planService.savePlan(interview.id, plan);

          return yield* interviewService.getInterviewById(interview.id);
        },
      );

      return PracticeService.of({ createPracticeInterview });
    }),
  );
}
