import type { InterviewBehavior, InterviewPlan } from "@ai-interview/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ai-interview/ui/alert-dialog";
import { Badge } from "@ai-interview/ui/badge";
import { Button, buttonVariants } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { InterviewForm } from "@/features/interviews/components/interview-form";

import { BehaviorToggle } from "./components/behavior-toggle";
import { PlanEditor } from "./components/plan-editor";
import { useDeleteInterview } from "./hooks/use-delete-interview";
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
  const deleteInterview = useDeleteInterview(interviewId);
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        {interview.isPending ? (
          <Skeleton className="h-10 w-72" />
        ) : interview.data ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-4xl tracking-tight">{interview.data.title}</h1>
                  <Badge variant={interview.data.status === "ready" ? "default" : "secondary"}>
                    {interview.data.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {interview.data.jobPosition} · {interview.data.experienceLevel} ·{" "}
                  {interview.data.difficulty} · {interview.data.persona} · {interview.data.model}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteInterview.isPending}
                    >
                      {deleteInterview.isPending ? "Deleting…" : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the interview and all of its sessions and evaluations. This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={() => deleteInterview.mutate()}
                      >
                        Delete interview
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </header>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Interview stages</CardTitle>
            <CardDescription>
              Define your stages and how many main questions each needs, then generate the questions
              with Gemini — or generate a whole plan from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
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

        <div className="space-y-6 lg:sticky lg:top-24">
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
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Past sessions for this interview, with their scores.
              </CardDescription>
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
                          {new Date(session.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
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
        </div>
      </div>

      {interview.data ? (
        <details className="group bg-card rounded-xl border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
            <span className="text-sm font-medium">Edit interview details</span>
            <span className="text-muted-foreground text-xs group-open:hidden">
              Role, model, description
            </span>
            <span className="text-muted-foreground hidden text-xs group-open:inline">Hide</span>
          </summary>
          <div className="border-t p-6">
            <InterviewForm interview={interview.data} bare />
          </div>
        </details>
      ) : null}
    </main>
  );
}
