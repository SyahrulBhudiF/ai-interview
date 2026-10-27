import type { Interview } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";

import { buildInterviewerInstructions } from "../src/modules/gemini/live";

const interview: Interview = {
  id: "interview-1",
  title: "Senior Backend Engineer",
  jobPosition: "Backend Engineer",
  experienceLevel: "senior",
  jobDescription: undefined,
  context: undefined,
  language: "en",
  difficulty: "intermediate",
  status: "ready",
  model: "gemini-3.8-flash",
  allowFollowUps: true,
  generateDetailedFeedback: true,
  strictMode: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("buildInterviewerInstructions", () => {
  it("includes the role, language, and current question", () => {
    const prompt = buildInterviewerInstructions(interview, "Explain a hash map.");

    assert.isTrue(prompt.includes("Backend Engineer"));
    assert.isTrue(prompt.includes("Explain a hash map."));
    assert.isTrue(prompt.includes("Speak in en."));
  });

  it("allows follow-ups when enabled and adds strictness when on", () => {
    const strict: Interview = { ...interview, strictMode: true, allowFollowUps: false };

    const prompt = buildInterviewerInstructions(strict, "Q");

    assert.isTrue(prompt.includes("Do not ask follow-ups"));
    assert.isTrue(prompt.includes("Be strict"));
  });
});
