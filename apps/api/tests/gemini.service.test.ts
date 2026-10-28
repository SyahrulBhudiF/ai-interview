import { InterviewPlanSchema, type Interview } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";

import {
  buildEvaluationPrompt,
  buildPlanPrompt,
  personaSystemPrompt,
} from "@/modules/gemini/service";

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
  model: "gemini-3.8-flash",
  persona: "professional",
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

  it("weights the plan toward a focus competency when provided", () => {
    const prompt = buildPlanPrompt(
      interview,
      [{ name: "Communication practice", mainQuestionCount: 3 }],
      "communication",
    );

    assert.isTrue(prompt.includes("weakest competency: communication"));
    assert.isTrue(prompt.includes("Communication practice"));
  });

  it("includes the candidate CV as context when present", () => {
    const prompt = buildPlanPrompt({
      ...interview,
      cvText: "Jane Doe — Backend Engineer, 6 years with Postgres and Go.",
    });

    assert.isTrue(prompt.includes("Candidate CV"));
    assert.isTrue(prompt.includes("Jane Doe — Backend Engineer"));
  });
});

describe("buildEvaluationPrompt", () => {
  it("includes the questions, transcript, and rubric instructions", () => {
    const prompt = buildEvaluationPrompt(
      interview,
      ["Explain a hash map.", "Design a URL shortener."],
      "candidate: some answer",
    );

    assert.isTrue(prompt.includes("Explain a hash map."));
    assert.isTrue(prompt.includes("Design a URL shortener."));
    assert.isTrue(prompt.includes("candidate: some answer"));
    assert.isTrue(prompt.includes("rubric score"));
  });
});

describe("personaSystemPrompt", () => {
  it("returns a distinct style line per persona", () => {
    assert.isTrue(personaSystemPrompt("friendly").includes("warm"));
    assert.isTrue(personaSystemPrompt("socratic").includes("why"));
    assert.isTrue(personaSystemPrompt("fast_paced").includes("fast-paced"));
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
