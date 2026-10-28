import type { EvaluationPoint, EvaluationReport } from "@ai-interview/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ai-interview/ui/tooltip";
import { cn } from "@ai-interview/ui/utils";

function DebriefCard({
  tone,
  title,
  description,
  items,
}: {
  tone: "keep" | "improve";
  title: string;
  description: string;
  items: ReadonlyArray<EvaluationPoint>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", tone === "keep" ? "bg-success" : "bg-warning")}
          />
          {title}
          <span className="text-muted-foreground text-xs font-normal tabular-nums">
            {items.length}
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing here.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <Tooltip key={`${item.point}-${item.reason}`}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${item.point}. Why: ${item.reason}`}
                    className={cn(
                      "focus-visible:ring-ring/50 max-w-full cursor-help rounded-full px-3 py-1.5 text-left text-xs leading-snug font-medium transition-colors outline-none focus-visible:ring-[3px]",
                      tone === "keep"
                        ? "bg-success/10 hover:bg-success/20"
                        : "bg-warning/10 hover:bg-warning/20",
                    )}
                  >
                    {item.point}
                    <span aria-hidden className="text-muted-foreground/70 ml-1 text-[10px]">
                      ?
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{item.reason}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** The score, rubric, debrief, and recommendation cards shared by both report pages. */
export function EvaluationReportView({ report }: { report: EvaluationReport }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall score</CardTitle>
            <span className="text-3xl font-semibold tabular-nums">{report.overallScore}</span>
          </div>
          <CardDescription>{report.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.scores.map((score) => (
            <div key={score.category} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{score.category.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground text-sm">{score.feedback}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{score.score}/5</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <DebriefCard tone="keep" title="Keep" description="What worked." items={report.strengths} />
        <DebriefCard
          tone="improve"
          title="Fix next"
          description="What held it back."
          items={report.improvements}
        />
      </div>

      {report.recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {report.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
