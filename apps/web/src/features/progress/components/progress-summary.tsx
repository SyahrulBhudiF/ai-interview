import type { ProgressSummary } from "@ai-interview/shared";
import { Card, CardContent } from "@ai-interview/ui/card";

export function ProgressSummaryCards({ summary }: { summary: ProgressSummary }) {
  const items = [
    { label: "Interviews", value: summary.interviews },
    { label: "Sessions", value: summary.sessions },
    { label: "Completed", value: summary.completedSessions },
    { label: "Evaluated", value: summary.evaluatedSessions },
    { label: "Average score", value: summary.averageScore ?? "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent>
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
