import { createFileRoute } from "@tanstack/react-router";

import { InterviewLivePage } from "@/features/interview-live/page";

export const Route = createFileRoute("/sessions/$sessionId/")({
  component: SessionLiveRoute,
});

function SessionLiveRoute() {
  const { sessionId } = Route.useParams();
  return <InterviewLivePage key={sessionId} sessionId={sessionId} />;
}
