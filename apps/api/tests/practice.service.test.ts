import type { Interview, InterviewPlan } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { GeminiService } from "@/modules/gemini/service";
import { InterviewPlanService } from "@/modules/interview/plan/service";
import { InterviewService } from "@/modules/interview/service";
import { PracticeService } from "@/modules/practice/service";

const draft: Interview = {
  id: "interview-practice",
  title: "Practice: communication",
  jobPosition: "Practice session",
  experienceLevel: "mid",
  context: "Focused practice on communication, the candidate's weakest competency.",
  language: "en",
  difficulty: "intermediate",
  status: "draft",
  model: "gemini-3.8-flash",
  persona: "professional",
  allowFollowUps: true,
  generateDetailedFeedback: true,
  strictMode: false,
  createdAt: "2026-10-27T00:00:00.000Z",
  updatedAt: "2026-10-27T00:00:00.000Z",
};

const ready: Interview = { ...draft, status: "ready" };

const plan: InterviewPlan = {
  stages: [
    {
      name: "communication practice",
      objective: "Probe how clearly the candidate explains trade-offs.",
      competencies: ["communication"],
      questions: [
        {
          text: "Walk me through a time you explained a technical trade-off to a non-technical stakeholder.",
          answerCriteria: ["clear structure", "concrete example"],
          rubric: "1-5 on clarity and audience awareness",
        },
      ],
    },
  ],
};

function practiceLayer() {
  const interviewService = InterviewService.of({
    listInterviews: () => Effect.succeed([]),
    getInterviewById: () => Effect.succeed(ready),
    createInterview: (input) => {
      assert.strictEqual(input.title, "Practice: communication");
      assert.strictEqual(input.jobPosition, "Practice session");
      assert.strictEqual(input.experienceLevel, "mid");
      assert.strictEqual(input.difficulty, "intermediate");
      assert.strictEqual(
        input.context,
        "Focused practice on communication, the candidate's weakest competency.",
      );
      return Effect.succeed(draft);
    },
    duplicateInterview: () => Effect.die("unused"),
    deleteInterview: () => Effect.die("unused"),
    updateBehavior: () => Effect.die("unused"),
    updateInterview: () => Effect.die("unused"),
  });

  const planService = InterviewPlanService.of({
    getPlan: () => Effect.succeed(plan),
    savePlan: (interviewId, savedPlan) => {
      assert.strictEqual(interviewId, draft.id);
      assert.deepStrictEqual(savedPlan, plan);
      return Effect.succeed(savedPlan);
    },
  });

  const geminiService = GeminiService.of({
    generateInterviewPlan: (interview, stages, focus) => {
      assert.strictEqual(interview.id, draft.id);
      assert.deepStrictEqual(stages, [{ name: "communication practice", mainQuestionCount: 3 }]);
      assert.strictEqual(focus, "communication");
      return Effect.succeed(plan);
    },
    generateFollowUp: () => Effect.die("unused"),
    generateEvaluation: () => Effect.die("unused"),
    generateCvReview: () => Effect.die("unused"),
    extractCv: () => Effect.die("unused"),
    listModels: () => Effect.die("unused"),
  });

  return PracticeService.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(InterviewService, interviewService),
        Layer.succeed(InterviewPlanService, planService),
        Layer.succeed(GeminiService, geminiService),
      ),
    ),
  );
}

describe("PracticeService.createPracticeInterview", () => {
  it.effect("creates, focuses, saves, and returns the ready interview", () =>
    Effect.gen(function* () {
      const interview = yield* PracticeService.use((service) =>
        service.createPracticeInterview("communication"),
      );

      assert.deepStrictEqual(interview, ready);
    }).pipe(Effect.provide(practiceLayer())),
  );
});
