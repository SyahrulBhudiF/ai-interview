import { Badge } from "@repo/components/badge";
import { Button } from "@repo/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/components/card";
import { Skeleton } from "@repo/components/skeleton";
import type { InterviewPlan } from "@repo/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { PlanEditor } from "./components/plan-editor";
import { useInterview } from "./hooks/use-interview";
import { useInterviewPlan } from "./hooks/use-interview-plan";

export function InterviewBuilderPage({ interviewId }: { interviewId: string }) {
  const interview = useInterview(interviewId);
  const { planQuery, generate, save } = useInterviewPlan(interviewId);
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

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        {interview.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : interview.data ? (
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{interview.data.title}</h1>
              <p className="text-muted-foreground text-sm">
                {interview.data.jobPosition} · {interview.data.experienceLevel} ·{" "}
                {interview.data.difficulty}
              </p>
            </div>
            <Badge variant={interview.data.status === "ready" ? "default" : "secondary"}>
              {interview.data.status}
            </Badge>
          </header>
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
    </main>
  );
}
