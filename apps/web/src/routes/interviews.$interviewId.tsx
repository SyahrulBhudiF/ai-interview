import { createFileRoute } from "@tanstack/react-router";

import { InterviewBuilderPage } from "@/features/interview-builder/page";

export const Route = createFileRoute("/interviews/$interviewId")({
  component: InterviewBuilderRoute,
});

function InterviewBuilderRoute() {
  const { interviewId } = Route.useParams();
  return <InterviewBuilderPage key={interviewId} interviewId={interviewId} />;
}
