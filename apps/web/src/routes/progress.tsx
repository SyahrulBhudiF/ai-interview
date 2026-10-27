import { createFileRoute } from "@tanstack/react-router";

import { ProgressPage } from "@/features/progress/page";

export const Route = createFileRoute("/progress")({ component: ProgressPage });
