import { createFileRoute } from "@tanstack/react-router";

import { NewInterviewPage } from "@/features/interview-new/page";

export const Route = createFileRoute("/interviews/new")({ component: NewInterviewPage });
