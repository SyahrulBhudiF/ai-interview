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
    <main className="page-shell max-w-5xl">
      <header className="space-y-3">
        <p className="eyebrow">Every attempt counts</p>
        <h1 className="page-heading">Your practice, over time.</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed">
          Scores from your saved debriefs. Find a skill that needs another attempt and build a
          practice interview around it.
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
