import type { InterviewPlan } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { planToRows } from "@/modules/interview/plan/mapper";
import { InterviewPlanService } from "@/modules/interview/plan/service";

describe("planToRows", () => {
  const plan: InterviewPlan = {
    stages: [
      {
        name: "Technical fundamentals",
        objective: "Assess core knowledge",
        competencies: ["algorithms", "data structures"],
        questions: [
          { text: "Explain a hash map.", answerCriteria: ["mentions hashing"], rubric: "1-5" },
          { text: "Explain a trie." },
        ],
      },
      {
        name: "System design",
        competencies: ["scalability"],
        questions: [{ text: "Design a URL shortener." }],
      },
    ],
  };

  it("maps stages and questions to rows with array order", () => {
    const { stages, questions } = planToRows("interview-1", plan, 2);

    assert.strictEqual(stages.length, 2);
    assert.strictEqual(questions.length, 3);

    assert.strictEqual(stages[0]?.order, 0);
    assert.strictEqual(stages[0]?.mainQuestionCount, 2);
    assert.strictEqual(stages[0]?.maxFollowUps, 2);
    assert.strictEqual(stages[0]?.objective, "Assess core knowledge");

    assert.strictEqual(stages[1]?.order, 1);
    assert.strictEqual(stages[1]?.objective, null);

    assert.strictEqual(questions[0]?.kind, "main");
    assert.strictEqual(questions[0]?.order, 0);
    assert.strictEqual(questions[0]?.answerCriteria?.[0], "mentions hashing");
    assert.strictEqual(questions[1]?.rubric, null);

    const secondStageQuestions = questions.filter((q) => q.stageId === stages[1]?.id);
    assert.strictEqual(secondStageQuestions.length, 1);
  });

  it("defaults maxFollowUps to 0 when not provided", () => {
    const { stages } = planToRows("interview-1", plan);
    assert.strictEqual(stages[0]?.maxFollowUps, 0);
  });
});

describe("InterviewPlanService.getPlan", () => {
  const emptyDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve([]),
        }),
      }),
    }),
  } as unknown as Database["Service"]["db"];

  const stubDatabaseLayer = Layer.succeed(Database, Database.of({ db: emptyDb }));
  const provide = InterviewPlanService.layer.pipe(Layer.provide(stubDatabaseLayer));

  it.effect("returns an empty plan when no stages are saved", () =>
    Effect.gen(function* () {
      const plan = yield* InterviewPlanService.use((service) => service.getPlan("interview-1"));
      assert.deepStrictEqual(plan, { stages: [] });
    }).pipe(Effect.provide(provide)),
  );
});
