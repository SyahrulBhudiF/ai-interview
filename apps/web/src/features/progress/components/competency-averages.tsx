import type { CompetencyAverage } from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";

export function CompetencyAverages({
  averages,
  onPractice,
  pendingCategory,
}: {
  averages: ReadonlyArray<CompetencyAverage>;
  onPractice: (category: CompetencyAverage["category"]) => void;
  pendingCategory?: CompetencyAverage["category"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competency averages</CardTitle>
        <CardDescription>Average rubric scores across evaluations, weakest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {averages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Evaluate a session to see competency averages.
          </p>
        ) : (
          <div className="space-y-3">
            {averages.map((entry, index) => (
              <div key={entry.category} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize">
                    {entry.category.replaceAll("_", " ")}
                  </p>
                  <div className="flex items-center gap-2">
                    {index === 0 && averages.length > 1 ? (
                      <Badge variant="secondary">Focus</Badge>
                    ) : null}
                    <span className="text-sm tabular-nums">{entry.average}/5</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pendingCategory !== undefined}
                      onClick={() => onPractice(entry.category)}
                    >
                      {pendingCategory === entry.category ? "Preparing…" : "Practice"}
                    </Button>
                  </div>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.min(100, (entry.average / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {entry.count} {entry.count === 1 ? "score" : "scores"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
