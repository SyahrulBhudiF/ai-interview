import type { CompetencyAverage, Progress } from "@ai-interview/shared";

import type {
  Evaluation as DbEvaluation,
  EvaluationScore as DbEvaluationScore,
  Interview as DbInterview,
  Session as DbSession,
} from "@/database/schema";

interface ProgressRows {
  interviews: ReadonlyArray<Pick<DbInterview, "id" | "title">>;
  sessions: ReadonlyArray<Pick<DbSession, "id" | "interviewId" | "status" | "createdAt">>;
  evaluations: ReadonlyArray<Pick<DbEvaluation, "sessionId" | "overallScore" | "createdAt">>;
  scores: ReadonlyArray<Pick<DbEvaluationScore, "category" | "score">>;
}

/** Maps interview, session, evaluation, and score rows to the progress dashboard payload. */
export function toProgress(rows: ProgressRows): Progress {
  const sessionById = new Map(rows.sessions.map((session) => [session.id, session]));
  const interviewById = new Map(rows.interviews.map((interview) => [interview.id, interview]));

  const scoreHistory = rows.evaluations
    .flatMap((evaluation) => {
      const session = sessionById.get(evaluation.sessionId);
      if (!session) return [];

      return [
        {
          sessionId: evaluation.sessionId,
          interviewId: session.interviewId,
          interviewTitle: interviewById.get(session.interviewId)?.title ?? "Untitled interview",
          overallScore: evaluation.overallScore,
          createdAt: evaluation.createdAt.toISOString(),
        },
      ];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalsByCategory = new Map<string, { total: number; count: number }>();

  for (const score of rows.scores) {
    const totals = totalsByCategory.get(score.category) ?? { total: 0, count: 0 };
    totals.total += score.score;
    totals.count += 1;
    totalsByCategory.set(score.category, totals);
  }

  const competencyAverages: CompetencyAverage[] = [...totalsByCategory.entries()]
    .map(([category, { total, count }]) => ({
      category: category as CompetencyAverage["category"],
      average: round1(total / count),
      count,
    }))
    .sort((a, b) => a.average - b.average);

  const averageScore =
    rows.evaluations.length > 0
      ? round1(
          rows.evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) /
            rows.evaluations.length,
        )
      : undefined;

  return {
    summary: {
      interviews: rows.interviews.length,
      sessions: rows.sessions.length,
      completedSessions: rows.sessions.filter((session) => session.status === "completed").length,
      evaluatedSessions: rows.evaluations.length,
      averageScore,
    },
    scoreHistory,
    competencyAverages,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
