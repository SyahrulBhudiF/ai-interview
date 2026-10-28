import { createFileRoute } from "@tanstack/react-router";

import { CvReviewPage } from "@/features/cv-review/page";

export const Route = createFileRoute("/cv-reviews/")({
  component: CvReviewPage,
});
