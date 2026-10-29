import { Skeleton } from "@ai-interview/ui/skeleton";
import { Link } from "@tanstack/react-router";

import { CvReviewForm } from "./components/cv-review-form";
import { useCvReviews } from "./hooks/use-cv-reviews";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function CvReviewPage() {
  const reviews = useCvReviews();

  return (
    <main className="page-shell max-w-3xl">
      <header className="space-y-3">
        <p className="eyebrow">Before you send the application</p>
        <h1 className="page-heading">How does your CV read?</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed">
          Add your CV and the role you're after. Gemini marks the lines that support your
          application, the claims that need evidence, and what to rewrite.
        </p>
      </header>

      <CvReviewForm />

      <section className="space-y-3">
        <h2 className="text-2xl">Previous reviews</h2>

        {reviews.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : reviews.error ? (
          <div className="bg-destructive/10 rounded-2xl px-6 py-5">
            <p className="font-medium">Could not load your reviews</p>
            <p className="text-muted-foreground mt-1 text-sm">{reviews.error.message}</p>
          </div>
        ) : reviews.data.length === 0 ? (
          <div className="bg-muted/40 rounded-2xl px-6 py-8">
            <p className="text-muted-foreground text-sm">
              Your saved reports will appear here, so you can return to the feedback while editing.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {reviews.data.map((review) => (
              <li key={review.id}>
                <Link
                  to="/cv-reviews/$reviewId"
                  params={{ reviewId: review.id }}
                  className="bg-card hover:bg-accent/40 flex items-center justify-between gap-4 rounded-2xl px-5 py-4 shadow-sm transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{review.jobPosition}</span>
                    <span className="text-muted-foreground block text-xs">
                      {review.experienceLevel} · {dateFormat.format(new Date(review.createdAt))}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{review.overallScore}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
