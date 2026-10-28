import {
  ApiSuccessSchema,
  InterviewSchema,
  SessionDetailResponseSchema,
  type EvaluationPoint,
} from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ai-interview/ui/tooltip";
import { cn } from "@ai-interview/ui/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";

import { CvPanel } from "@/components/cv-panel";
import { api } from "@/lib/eden";

import { useEvaluation } from "./hooks/use-evaluation";

function DebriefCard({
  tone,
  title,
  description,
  items,
}: {
  tone: "keep" | "improve";
  title: string;
  description: string;
  items: ReadonlyArray<EvaluationPoint>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", tone === "keep" ? "bg-success" : "bg-warning")}
          />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing here.</p>
        ) : (
          items.map((item) => (
            <Tooltip key={`${item.point}-${item.reason}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${item.point}. Why: ${item.reason}`}
                  className={cn(
                    "focus-visible:ring-ring/50 w-full rounded-xl px-3 py-2 text-left transition-colors outline-none focus-visible:ring-[3px]",
                    tone === "keep"
                      ? "bg-success/10 hover:bg-success/20"
                      : "bg-warning/10 hover:bg-warning/20",
                  )}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm leading-snug font-medium">{item.point}</span>
                    <span className="text-muted-foreground mt-0.5 shrink-0 text-[10px] font-semibold tracking-[0.12em] uppercase">
                      Why
                    </span>
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{item.reason}</TooltipContent>
            </Tooltip>
          ))
        )}
      </CardContent>
    </Card>
  );
}

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
    <main
      className={cn("mx-auto flex flex-col gap-6 px-6 py-10", cvText ? "max-w-5xl" : "max-w-3xl")}
    >
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

      <div
        className={cn(
          "grid gap-6",
          cvText ? "lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start" : undefined,
        )}
      >
        <div className="space-y-6">
          {cvText ? <CvPanel cvText={cvText} collapsible className="lg:hidden" /> : null}

          {evaluation.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : report ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Overall score</CardTitle>
                    <span className="text-3xl font-semibold tabular-nums">
                      {report.overallScore}
                    </span>
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
                <DebriefCard
                  tone="keep"
                  title="Keep"
                  description="What worked in this session."
                  items={report.strengths}
                />
                <DebriefCard
                  tone="improve"
                  title="Fix next"
                  description="What held the answers back."
                  items={report.improvements}
                />
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
                    <p className="text-muted-foreground text-xs uppercase">{entry.role}</p>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {cvText ? (
          <CvPanel cvText={cvText} className="hidden lg:sticky lg:top-24 lg:block" />
        ) : null}
      </div>
    </main>
  );
}
