import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";

import { useInterviews } from "@/features/interviews/hooks/use-interviews";
import { useProgress } from "@/features/progress/hooks/use-progress";

const steps = [
  {
    number: "01",
    title: "Build the brief",
    body: "Set the role, level, and difficulty. Gemini turns it into a staged question plan.",
  },
  {
    number: "02",
    title: "Rehearse out loud",
    body: "Run a live voice interview. Follow-ups adapt to what you actually say.",
  },
  {
    number: "03",
    title: "Read the debrief",
    body: "Get a rubric score, per-competency feedback, and the next thing to practice.",
  },
];

export function HomePage() {
  const interviews = useInterviews();
  const progress = useProgress();
  const recent = interviews.data?.slice(0, 4) ?? [];
  const summary = progress.data?.summary;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-16">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-6">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            Interview practice
          </p>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Walk into the room already warmed up.
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
            Build a role-specific interview, rehearse it with a Gemini interviewer, and leave with a
            rubric-based debrief.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/interviews/new">Start an interview</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/interviews">Browse interviews</Link>
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
            Your progress
          </p>
          {progress.isPending ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <Stat label="Interviews" value={summary?.interviews ?? 0} />
              <Stat label="Sessions" value={summary?.sessions ?? 0} />
              <Stat label="Avg score" value={summary?.averageScore ?? "—"} />
            </div>
          )}
          <Link
            to="/progress"
            className="text-primary mt-6 inline-block text-sm font-medium underline underline-offset-4"
          >
            See the full breakdown
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl tracking-tight">Recent interviews</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Pick up where you left off, or start a new brief.
            </p>
          </div>
          <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
            View all
          </Link>
        </div>
        {interviews.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-10">
            <p className="font-medium">Nothing here yet</p>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Your first interview takes a minute to set up. Gemini handles the question plan.
            </p>
            <Link
              to="/interviews/new"
              className="text-primary mt-4 inline-block text-sm font-medium underline underline-offset-4"
            >
              Create an interview
            </Link>
          </div>
        ) : (
          <div className="divide-border divide-y rounded-xl border">
            {recent.map((interview) => (
              <Link
                key={interview.id}
                to="/interviews/$interviewId"
                params={{ interviewId: interview.id }}
                className="hover:bg-muted/50 flex items-center justify-between gap-4 px-5 py-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{interview.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {interview.jobPosition} · {interview.experienceLevel} · {interview.difficulty}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={interview.status === "ready" ? "default" : "secondary"}>
                    {interview.status}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="font-serif text-3xl tracking-tight">How it works</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Three passes, one loop. Repeat the weak spots.
          </p>
        </div>
        <div className="grid gap-8 border-t pt-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="space-y-3">
              <span className="text-primary font-serif text-2xl">{step.number}</span>
              <p className="font-medium">{step.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
