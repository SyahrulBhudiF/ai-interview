import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";

import { CompetencyAverages } from "./components/competency-averages";
import { ProgressSummaryCards } from "./components/progress-summary";
import { ScoreHistory } from "./components/score-history";
import { useProgress } from "./hooks/use-progress";

const summaryPlaceholders = ["interviews", "sessions", "completed", "evaluated", "average"];

export function ProgressPage() {
  const progress = useProgress();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        <header>
          <h1 className="text-2xl font-semibold">Progress</h1>
          <p className="text-muted-foreground text-sm">
            Compare scores across interviews and see which competencies need practice.
          </p>
        </header>
      </div>

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
            <CompetencyAverages averages={progress.data.competencyAverages} />
          </div>
        </>
      ) : null}
    </main>
  );
}
