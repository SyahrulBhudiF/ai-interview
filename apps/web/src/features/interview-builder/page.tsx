import type { InterviewBehavior, InterviewPlan } from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { BehaviorToggle } from "./components/behavior-toggle";
import { PlanEditor } from "./components/plan-editor";
import { useDuplicateInterview } from "./hooks/use-duplicate-interview";
import { useInterview } from "./hooks/use-interview";
import { useInterviewPlan } from "./hooks/use-interview-plan";
import { useInterviewSessions } from "./hooks/use-interview-sessions";
import { useStartSession } from "./hooks/use-start-session";

export function InterviewBuilderPage({ interviewId }: { interviewId: string }) {
  const interview = useInterview(interviewId);
  const { planQuery, generate, save } = useInterviewPlan(interviewId);
  const startSession = useStartSession(interviewId);
  const duplicate = useDuplicateInterview(interviewId);
  const sessions = useInterviewSessions(interviewId);
  const [draft, setDraft] = useState<InterviewPlan | null>(null);

  const plan = draft ?? planQuery.data ?? { stages: [] };
  const hasStages = plan.stages.length > 0;

  const generatePlan = () => {
    const stages = plan.stages.map((stage) => ({
      name: stage.name,
      mainQuestionCount: stage.questions.length,
    }));

    generate.mutate(stages, { onSuccess: setDraft });
  };

  const behavior = interview.data;

  const toggleBehavior = (patch: Partial<InterviewBehavior>) => {
    if (!behavior) return;

    interview.updateBehavior.mutate({
      allowFollowUps: behavior.allowFollowUps,
      generateDetailedFeedback: behavior.generateDetailedFeedback,
      strictMode: behavior.strictMode,
      ...patch,
    });
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        {interview.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : interview.data ? (
          <>
            <header className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{interview.data.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {interview.data.jobPosition} · {interview.data.experienceLevel} ·{" "}
                  {interview.data.difficulty} · {interview.data.persona} · {interview.data.model}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => startSession.mutate()}
                  disabled={interview.data.status !== "ready" || startSession.isPending}
                >
                  {startSession.isPending ? "Starting…" : "Start interview"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => duplicate.mutate()}
                  disabled={duplicate.isPending}
                >
                  {duplicate.isPending ? "Duplicating…" : "Duplicate"}
                </Button>
                <Badge variant={interview.data.status === "ready" ? "default" : "secondary"}>
                  {interview.data.status}
                </Badge>
              </div>
            </header>
            {startSession.error ? (
              <p className="text-destructive text-sm">{startSession.error.message}</p>
            ) : null}
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview stages</CardTitle>
          <CardDescription>
            Define your stages and how many main questions each needs, then generate the questions
            with Gemini — or generate a whole plan from scratch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={generatePlan} disabled={generate.isPending}>
              {generate.isPending
                ? "Generating…"
                : hasStages
                  ? "Generate questions"
                  : "Generate plan"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={save.isPending || !hasStages}
              onClick={() => save.mutate(plan)}
            >
              {save.isPending ? "Saving…" : "Save plan"}
            </Button>
          </div>

          {generate.error ? (
            <p className="text-destructive text-sm">{generate.error.message}</p>
          ) : null}
          {save.error ? <p className="text-destructive text-sm">{save.error.message}</p> : null}
          {save.isSuccess && !save.isPending ? (
            <p className="text-sm font-medium text-green-600">Plan saved.</p>
          ) : null}

          {planQuery.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {!hasStages ? (
                <p className="text-muted-foreground text-sm">
                  No stages yet. Add a stage and set its question count, then generate — or let
                  Gemini design the whole plan.
                </p>
              ) : null}
              <PlanEditor plan={plan} onChange={setDraft} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview behavior</CardTitle>
          <CardDescription>How the interviewer runs the session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {interview.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : behavior ? (
            <>
              <BehaviorToggle
                id="allow-follow-ups"
                checked={behavior.allowFollowUps}
                disabled={interview.updateBehavior.isPending}
                label="Allow dynamic follow-up questions"
                description="The interviewer may ask follow-ups beyond the main questions."
                onToggle={(checked) => toggleBehavior({ allowFollowUps: checked })}
              />
              <BehaviorToggle
                id="generate-detailed-feedback"
                checked={behavior.generateDetailedFeedback}
                disabled={interview.updateBehavior.isPending}
                label="Generate detailed feedback"
                description="Produce a full evaluation report after the interview."
                onToggle={(checked) => toggleBehavior({ generateDetailedFeedback: checked })}
              />
              <BehaviorToggle
                id="strict-mode"
                checked={behavior.strictMode}
                disabled={interview.updateBehavior.isPending}
                label="Strict interviewer mode"
                description="Direct, no-hints interviewing that challenges weak answers."
                onToggle={(checked) => toggleBehavior({ strictMode: checked })}
              />
              {interview.updateBehavior.error ? (
                <p className="text-destructive text-sm">{interview.updateBehavior.error.message}</p>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Past sessions for this interview, with their scores.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : !sessions.data || sessions.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.data.map(({ session, overallScore }) => (
                <Link
                  key={session.id}
                  to="/sessions/$sessionId/results"
                  params={{ sessionId: session.id }}
                  className="hover:bg-accent/40 flex items-center justify-between rounded-md border p-3 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">{session.status}</p>
                  </div>
                  {overallScore !== undefined ? (
                    <span className="text-sm font-semibold tabular-nums">{overallScore}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
