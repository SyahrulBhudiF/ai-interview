import { TEXT_LIMITS } from "@ai-interview/shared";
import { describe, expect, it } from "vitest";

import { app } from "@/index";

function request(path: string, init?: RequestInit) {
  return app.handle(new Request(`http://localhost${path}`, init));
}

describe("api app", () => {
  it("returns the health success envelope", async () => {
    const response = await request("/api/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { name: "ai-interview-api", status: "ok", uptime: expect.any(Number) },
    });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns the error envelope for an invalid body", async () => {
    const response = await request("/api/interviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", message: "Invalid request" },
    });
    expect(body.error.issues.length).toBeGreaterThan(0);
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("rejects plans above the stage and question caps", async () => {
    const generatePlan = (stages: unknown) =>
      request("/api/interviews/interview-1/generate-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stages }),
      });

    const tooManyStages = await generatePlan(
      Array.from({ length: TEXT_LIMITS.stages + 1 }, (_, index) => ({
        name: `Stage ${index + 1}`,
        mainQuestionCount: 1,
      })),
    );

    const tooManyQuestions = await generatePlan([
      { name: "Stage", mainQuestionCount: TEXT_LIMITS.questionsPerStage + 1 },
    ]);

    const fractionalQuestions = await generatePlan([{ name: "Stage", mainQuestionCount: 1.5 }]);

    expect(tooManyStages.status).toBe(422);
    expect(tooManyQuestions.status).toBe(422);
    expect(fractionalQuestions.status).toBe(422);
  });

  it("returns the error envelope for a missing route", async () => {
    const response = await request("/api/missing");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", message: "Not found" },
    });
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });
});
