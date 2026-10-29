import type { ProgressSummary } from "@ai-interview/shared";

export function ProgressSummaryCards({ summary }: { summary: ProgressSummary }) {
  const items = [
    { label: "Interviews", value: summary.interviews },
    { label: "Sessions", value: summary.sessions },
    { label: "Completed", value: summary.completedSessions },
    { label: "Evaluated", value: summary.evaluatedSessions },
    { label: "Average / 100", value: summary.averageScore ?? "—" },
  ];

  return (
    <dl className="bg-secondary/60 grid grid-cols-2 gap-x-6 gap-y-7 rounded-3xl p-6 sm:grid-cols-3 sm:p-8 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground text-sm">{item.label}</dt>
          <dd className="text-primary mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
