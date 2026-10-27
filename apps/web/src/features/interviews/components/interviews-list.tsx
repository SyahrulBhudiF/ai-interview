import type { Interview } from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";

const placeholders = ["one", "two", "three", "four"];

export function InterviewsList({
  interviews,
  isPending,
  error,
}: {
  interviews: readonly Interview[] | undefined;
  isPending: boolean;
  error?: Error | null;
}) {
  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {placeholders.map((placeholder) => (
          <Skeleton key={placeholder} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 rounded-2xl px-8 py-10">
        <p className="font-medium">Could not load interviews</p>
        <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!interviews || interviews.length === 0) {
    return (
      <div className="bg-muted/40 flex flex-col items-start gap-3 rounded-2xl px-8 py-12">
        <p className="font-medium">No interviews yet</p>
        <p className="text-muted-foreground max-w-md text-sm">
          Create an interview to define the role, generate a plan, and rehearse with the AI
          interviewer.
        </p>
        <Link
          to="/interviews/new"
          className="text-primary text-sm font-medium underline underline-offset-4"
        >
          Create your first interview
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {interviews.map((interview) => (
        <Link
          key={interview.id}
          to="/interviews/$interviewId"
          params={{ interviewId: interview.id }}
        >
          <Card className="flex h-full flex-col justify-between transition-shadow hover:shadow-md">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base leading-snug">{interview.title}</CardTitle>
                <Badge variant={interview.status === "ready" ? "default" : "secondary"}>
                  {interview.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {interview.jobPosition} · {interview.experienceLevel} · {interview.difficulty}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Created{" "}
                {new Date(interview.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="font-medium">Open →</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
