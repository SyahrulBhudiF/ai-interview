import { ApiSuccessSchema, SessionDetailResponseSchema } from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";

import { api } from "@/lib/eden";

import { useEvaluation } from "./hooks/use-evaluation";

export function InterviewResultsPage({ sessionId }: { sessionId: string }) {
  const evaluation = useEvaluation(sessionId);

  const sessionQuery = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).get();
      if (error || !data) throw new Error("Failed to load the session.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionDetailResponseSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const report = evaluation.data;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <Link
          to="/sessions/$sessionId"
          params={{ sessionId }}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Session
        </Link>
        <header className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-4xl tracking-tight">Interview results</h1>
          {sessionQuery.data ? (
            <Badge
              variant={sessionQuery.data.session.status === "completed" ? "default" : "secondary"}
            >
              {sessionQuery.data.session.status}
            </Badge>
          ) : null}
        </header>
      </div>

      {evaluation.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : report ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Overall score</CardTitle>
                <span className="text-3xl font-semibold tabular-nums">{report.overallScore}</span>
              </div>
              <CardDescription>{report.summary}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rubric</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.scores.map((score) => (
                <div key={score.category} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{score.category.replaceAll("_", " ")}</p>
                    <p className="text-muted-foreground text-sm">{score.feedback}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{score.score}/5</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {report.recommendations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {report.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Not evaluated yet</CardTitle>
            <CardDescription>
              Generate a rubric-based report from this session's transcript.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              onClick={() => evaluation.evaluate.mutate()}
              disabled={evaluation.evaluate.isPending}
            >
              {evaluation.evaluate.isPending ? "Evaluating…" : "Evaluate interview"}
            </Button>
            {evaluation.evaluate.error ? (
              <p className="text-destructive text-sm">{evaluation.evaluate.error.message}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {sessionQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionQuery.data.transcript.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.role === "ai" ? "bg-muted rounded-md p-3" : "rounded-md border p-3"
                }
              >
                <p className="text-muted-foreground text-xs uppercase">{entry.role}</p>
                <p className="text-sm">{entry.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
