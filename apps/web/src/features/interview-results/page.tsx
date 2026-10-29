import {
  ApiSuccessSchema,
  InterviewSchema,
  SessionDetailResponseSchema,
} from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { cn } from "@ai-interview/ui/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";

import { CvPanel } from "@/components/cv-panel";
import { EvaluationReportView } from "@/components/evaluation-report";
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

  const interviewId = sessionQuery.data?.session.interviewId;

  const interviewQuery = useQuery({
    queryKey: ["interviews", interviewId],
    queryFn: async () => {
      if (!interviewId) throw new Error("Missing interview id");
      const { data, error } = await api.interviews({ id: interviewId }).get();
      if (error || !data) throw new Error("Failed to load the interview.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    enabled: Boolean(interviewId) && !import.meta.env.SSR,
  });

  const report = evaluation.data;
  const cvText = interviewQuery.data?.cvText;

  return (
    <main className={cn("page-shell gap-6", cvText ? "max-w-6xl" : "max-w-3xl")}>
      <div className="space-y-3">
        <Link
          to="/sessions/$sessionId"
          params={{ sessionId }}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Session
        </Link>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">After the conversation</p>
            <h1 className="page-heading">Your interview debrief</h1>
          </div>
          {sessionQuery.data ? (
            <Badge
              variant={sessionQuery.data.session.status === "completed" ? "default" : "secondary"}
            >
              {sessionQuery.data.session.status}
            </Badge>
          ) : null}
        </header>
      </div>

      <div
        className={cn(
          "grid gap-6",
          cvText ? "lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start" : undefined,
        )}
      >
        <div className="space-y-6">
          {cvText ? (
            <CvPanel
              cvText={cvText}
              highlights={report?.cvHighlights}
              collapsible
              className="lg:hidden"
            />
          ) : null}

          {evaluation.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : report ? (
            <EvaluationReportView report={report} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>What did your answers show?</CardTitle>
                <CardDescription>
                  Ask Gemini to score this transcript against the interview rubric and explain which
                  answers need another pass.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  onClick={() => evaluation.evaluate.mutate()}
                  disabled={evaluation.evaluate.isPending}
                >
                  {evaluation.evaluate.isPending ? "Reading your answers…" : "Generate debrief"}
                </Button>
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
                      entry.role === "ai"
                        ? "bg-muted/60 rounded-2xl p-4"
                        : "bg-accent/40 rounded-2xl p-4"
                    }
                  >
                    <p className="text-primary mb-2 text-xs font-medium">
                      {entry.role === "ai" ? "Interviewer" : "You"}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {cvText ? (
          <CvPanel
            cvText={cvText}
            highlights={report?.cvHighlights}
            className="hidden lg:sticky lg:top-24 lg:block"
          />
        ) : null}
      </div>
    </main>
  );
}
