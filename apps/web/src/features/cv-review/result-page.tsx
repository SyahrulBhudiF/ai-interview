import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ai-interview/ui/alert-dialog";
import { Badge } from "@ai-interview/ui/badge";
import { Button, buttonVariants } from "@ai-interview/ui/button";
import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";

import { CvPanel } from "@/components/cv-panel";
import { EvaluationReportView } from "@/components/evaluation-report";

import { useCvReview } from "./hooks/use-cv-review";
import { useDeleteCvReview } from "./hooks/use-delete-cv-review";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function CvReviewResultPage({ reviewId }: { reviewId: string }) {
  const review = useCvReview(reviewId);
  const deleteReview = useDeleteCvReview(reviewId);

  if (review.isPending) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (review.error || !review.data) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
        <Link to="/cv-reviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← CV review
        </Link>
        <div className="bg-destructive/10 rounded-2xl px-6 py-5">
          <p className="font-medium">Could not load this review</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {review.error?.message ?? "The review no longer exists."}
          </p>
        </div>
      </main>
    );
  }

  const data = review.data;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="space-y-3">
        <Link to="/cv-reviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← CV review
        </Link>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              CV review
            </p>
            <h1 className="font-serif text-4xl tracking-tight">{data.jobPosition}</h1>
            <p className="text-muted-foreground text-sm">
              {data.experienceLevel} · {dateFormat.format(new Date(data.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="tabular-nums">
              {data.report.overallScore}/100
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deleteReview.isPending}
                >
                  {deleteReview.isPending ? "Deleting…" : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the saved review and its report. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    onClick={() => deleteReview.mutate()}
                  >
                    Delete review
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <CvPanel
            cvText={data.cvText}
            highlights={data.report.cvHighlights}
            title="Reviewed CV"
            collapsible
            className="lg:hidden"
          />
          <EvaluationReportView report={data.report} />
          <p className="text-sm">
            <Link
              to="/cv-reviews"
              className="text-primary font-medium underline underline-offset-4"
            >
              Review another CV
            </Link>
          </p>
        </div>

        <CvPanel
          cvText={data.cvText}
          highlights={data.report.cvHighlights}
          title="Reviewed CV"
          description="Marked lines are the evidence behind this review."
          className="hidden lg:sticky lg:top-24 lg:block"
        />
      </div>
    </main>
  );
}
