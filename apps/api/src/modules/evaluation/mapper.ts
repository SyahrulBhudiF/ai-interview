import type { EvaluationReport } from "@ai-interview/shared";

import type {
  Evaluation as DbEvaluation,
  EvaluationScore as DbEvaluationScore,
  NewEvaluation,
  NewEvaluationScore,
} from "@/database/schema";

/** Maps an evaluation row and its score rows to the shared wire type. */
export function toEvaluationReport(
  evaluation: DbEvaluation,
  scores: ReadonlyArray<DbEvaluationScore>,
): EvaluationReport {
  return {
    overallScore: evaluation.overallScore,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
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
