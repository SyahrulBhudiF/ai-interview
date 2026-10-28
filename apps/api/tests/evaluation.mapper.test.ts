import type { EvaluationPoint } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";

import { toEvaluationReport } from "@/modules/evaluation/mapper";

describe("toEvaluationReport", () => {
  it("normalizes legacy string points into point and reason pairs", () => {
    const report = toEvaluationReport(
      {
        id: "evaluation-1",
        sessionId: "session-1",
        overallScore: 78,
        summary: "Solid answers.",
        strengths: ["Quantified impact"] as unknown as EvaluationPoint[],
        improvements: ["Deeper trade-offs"] as unknown as EvaluationPoint[],
        cvHighlights: [],
        recommendations: ["Practice system design"],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      [],
    );

    assert.deepStrictEqual(report.strengths, [
      { point: "Quantified impact", reason: "Quantified impact" },
    ]);
    assert.deepStrictEqual(report.improvements, [
      { point: "Deeper trade-offs", reason: "Deeper trade-offs" },
    ]);
    assert.deepStrictEqual(report.cvHighlights, []);
  });
});
