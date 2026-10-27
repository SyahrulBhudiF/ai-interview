import { Layer, ManagedRuntime } from "effect";

import { Database } from "@/database/client";
import { GeminiLiveService } from "@/modules/gemini/live";
import { GeminiService } from "@/modules/gemini/service";
import { InterviewPlanService } from "@/modules/interview/plan/service";
import { InterviewService } from "@/modules/interview/service";
import { InterviewOrchestratorService } from "@/modules/session/orchestrator/service";
import { SessionService } from "@/modules/session/service";
import { TranscriptService } from "@/modules/session/transcript/service";
import { UserService } from "@/modules/user/service";

const orchestratorLayer = Layer.provideMerge(
  InterviewOrchestratorService.layer,
  Layer.mergeAll(SessionService.layer, TranscriptService.layer, GeminiService.layer),
);

/**
 * Single runtime for the whole API, built from every service layer.
 * Add each new module's service layer (and its dependencies) here.
 */
export const runtime = ManagedRuntime.make(
  Layer.mergeAll(
    UserService.layer,
    InterviewService.layer,
    InterviewPlanService.layer,
    GeminiLiveService.layer,
    orchestratorLayer,
  ).pipe(Layer.provide(Database.layer)),
);
