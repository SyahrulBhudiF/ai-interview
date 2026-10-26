import { Badge } from "@repo/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/components/card";
import { Skeleton } from "@repo/components/skeleton";
import type { Interview } from "@repo/shared";
import { Link } from "@tanstack/react-router";

export function InterviewsList({
  interviews,
  isPending,
}: {
  interviews: readonly Interview[] | undefined;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!interviews || interviews.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No interviews yet. Create your first one above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {interviews.map((interview) => (
        <Link
          key={interview.id}
          to="/interviews/$interviewId"
          params={{ interviewId: interview.id }}
          className="block"
        >
          <Card className="hover:bg-accent/40 transition-colors">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>{interview.title}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {interview.jobPosition} · {interview.experienceLevel} · {interview.language}
                </p>
              </div>
              <Badge variant={interview.status === "ready" ? "default" : "secondary"}>
                {interview.status}
              </Badge>
            </CardHeader>
            {interview.jobDescription ? (
              <CardContent className="text-muted-foreground line-clamp-2 text-sm">
                {interview.jobDescription}
              </CardContent>
            ) : null}
          </Card>
        </Link>
      ))}
    </div>
  );
}
