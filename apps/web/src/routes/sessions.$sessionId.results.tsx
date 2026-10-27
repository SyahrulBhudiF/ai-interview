import { createFileRoute } from "@tanstack/react-router";

import { InterviewResultsPage } from "@/features/interview-results/page";

export const Route = createFileRoute("/sessions/$sessionId/results")({
  component: SessionResultsRoute,
});

function SessionResultsRoute() {
  const { sessionId } = Route.useParams();
  return <InterviewResultsPage key={sessionId} sessionId={sessionId} />;
}
