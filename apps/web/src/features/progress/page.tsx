import { Skeleton } from "@ai-interview/ui/skeleton";

import { CompetencyAverages } from "./components/competency-averages";
import { ProgressSummaryCards } from "./components/progress-summary";
import { ScoreHistory } from "./components/score-history";
import { usePracticeInterview } from "./hooks/use-practice";
import { useProgress } from "./hooks/use-progress";

const summaryPlaceholders = ["interviews", "sessions", "completed", "evaluated", "average"];

export function ProgressPage() {
  const progress = useProgress();
  const practice = usePracticeInterview();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">Progress</p>
        <h1 className="font-serif text-4xl tracking-tight">Your progress</h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          Compare scores across interviews and see which competencies need practice.
        </p>
      </header>

      {progress.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summaryPlaceholders.map((placeholder) => (
            <Skeleton key={placeholder} className="h-24 w-full" />
          ))}
        </div>
      ) : progress.error ? (
        <p className="text-destructive text-sm">{progress.error.message}</p>
      ) : progress.data ? (
        <>
          <ProgressSummaryCards summary={progress.data.summary} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreHistory scores={progress.data.scoreHistory} />
            <CompetencyAverages
              averages={progress.data.competencyAverages}
              onPractice={(category) => practice.mutate(category)}
              pendingCategory={practice.isPending ? practice.variables : undefined}
            />
          </div>
        </>
      ) : null}
    </main>
  );
}
