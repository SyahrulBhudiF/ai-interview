import { createFileRoute } from "@tanstack/react-router";

import { InterviewsPage } from "@/features/interviews/page";

export const Route = createFileRoute("/interviews/")({
  component: InterviewsPage,
});
