import type { ProgressScore } from "@ai-interview/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Link } from "@tanstack/react-router";

export function ScoreHistory({ scores }: { scores: ReadonlyArray<ProgressScore> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score history</CardTitle>
        <CardDescription>Overall scores from evaluated sessions, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {scores.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No evaluated sessions yet. Complete an interview and generate its report.
          </p>
        ) : (
          <div className="space-y-3">
            {scores.map((score) => (
              <div key={score.sessionId} className="space-y-2 rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{score.interviewTitle}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(score.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {score.overallScore}/100
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, score.overallScore))}%` }}
                  />
                </div>
                <div className="flex gap-4 text-sm">
                  <Link
                    to="/sessions/$sessionId/results"
                    params={{ sessionId: score.sessionId }}
                    className="underline underline-offset-4"
                  >
                    View results
                  </Link>
                  <Link
                    to="/interviews/$interviewId"
                    params={{ interviewId: score.interviewId }}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Retry
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
