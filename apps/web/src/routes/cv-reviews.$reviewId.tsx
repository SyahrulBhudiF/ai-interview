import { createFileRoute } from "@tanstack/react-router";

import { CvReviewResultPage } from "@/features/cv-review/result-page";

export const Route = createFileRoute("/cv-reviews/$reviewId")({
  component: CvReviewResultRoute,
});

function CvReviewResultRoute() {
  const { reviewId } = Route.useParams();
  return <CvReviewResultPage key={reviewId} reviewId={reviewId} />;
}
