import type { EvaluationPoint, EvaluationReport } from "@ai-interview/shared";

import type {
  Evaluation as DbEvaluation,
  EvaluationScore as DbEvaluationScore,
  NewEvaluation,
  NewEvaluationScore,
} from "@/database/schema";

/** Older rows stored plain strings; keep them readable as points. */
function toPoints(value: ReadonlyArray<EvaluationPoint | string>): EvaluationPoint[] {
  return value.map((item) => (typeof item === "string" ? { point: item, reason: item } : item));
}

/** Maps an evaluation row and its score rows to the shared wire type. */
export function toEvaluationReport(
  evaluation: DbEvaluation,
  scores: ReadonlyArray<DbEvaluationScore>,
): EvaluationReport {
  return {
    overallScore: evaluation.overallScore,
    summary: evaluation.summary,
    strengths: toPoints(evaluation.strengths),
    improvements: toPoints(evaluation.improvements),
    recommendations: evaluation.recommendations,
    scores: scores.map((score) => ({
      category: score.category as EvaluationReport["scores"][number]["category"],
      score: score.score,
      feedback: score.feedback ?? "",
    })),
  };
}

/** Builds the insert row for an evaluation report. */
export function newEvaluationRow(sessionId: string, report: EvaluationReport): NewEvaluation {
  return {
    id: crypto.randomUUID(),
    sessionId,
    overallScore: report.overallScore,
    summary: report.summary,
    strengths: [...report.strengths],
    improvements: [...report.improvements],
    recommendations: [...report.recommendations],
  };
}

/** Builds insert rows for an evaluation's category scores. */
export function newEvaluationScoreRows(
  evaluationId: string,
  scores: ReadonlyArray<EvaluationReport["scores"][number]>,
): NewEvaluationScore[] {
  return scores.map((score) => ({
    id: crypto.randomUUID(),
    evaluationId,
    category: score.category,
    score: score.score,
    feedback: score.feedback,
  }));
}
