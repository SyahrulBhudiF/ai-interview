import { assert, describe, it } from "@effect/vitest";
import { InterviewPlanSchema, type Interview } from "@repo/shared";
import { Schema } from "effect";

import { buildPlanPrompt } from "@/modules/gemini/service";

const interview: Interview = {
  id: "interview-1",
  title: "Senior Backend Engineer",
  jobPosition: "Backend Engineer",
  experienceLevel: "senior",
  jobDescription: "Design and build distributed APIs.",
  context: "Team building a real-time platform.",
  language: "en",
  difficulty: "intermediate",
  status: "draft",
  allowFollowUps: true,
  generateDetailedFeedback: true,
  strictMode: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("buildPlanPrompt", () => {
  it("includes the role, level, difficulty, language, and context", () => {
    const prompt = buildPlanPrompt(interview);

    assert.isTrue(prompt.includes("Backend Engineer"));
    assert.isTrue(prompt.includes("senior"));
    assert.isTrue(prompt.includes("intermediate"));
    assert.isTrue(prompt.includes("Team building a real-time platform."));
    assert.isTrue(prompt.includes("Respond in en."));
  });

  it("fills a defined stage structure when stages are provided", () => {
    const prompt = buildPlanPrompt(interview, [
      { name: "HR Screening", mainQuestionCount: 3 },
      { name: "System Design", mainQuestionCount: 2 },
    ]);

    assert.isTrue(prompt.includes("HR Screening"));
    assert.isTrue(prompt.includes("3 main question(s)"));
    assert.isTrue(prompt.includes("System Design"));
    assert.isTrue(prompt.includes("2 main question(s)"));
  });
});

describe("InterviewPlanSchema", () => {
  it("accepts a schema-validated Gemini fixture", () => {
    const fixture = {
      stages: [
        {
          name: "Technical fundamentals",
          objective: "Assess core engineering knowledge",
          competencies: ["algorithms", "data structures"],
          questions: [
            {
              text: "Explain how a hash map works.",
              answerCriteria: ["mentions hashing", "explains collision handling"],
              rubric: "Score 1-5 on correctness and clarity",
            },
          ],
        },
      ],
    };

    assert.deepStrictEqual(Schema.decodeUnknownSync(InterviewPlanSchema)(fixture), fixture);
  });
});
