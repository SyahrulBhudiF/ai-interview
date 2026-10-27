import { Layer, ManagedRuntime } from "effect";

import { Database } from "@/database/client";
import { EvaluationService } from "@/modules/evaluation/service";
import { GeminiLiveService } from "@/modules/gemini/live";
import { GeminiService } from "@/modules/gemini/service";
import { InterviewPlanService } from "@/modules/interview/plan/service";
import { InterviewService } from "@/modules/interview/service";
import { PracticeService } from "@/modules/practice/service";
import { ProgressService } from "@/modules/progress/service";
import { InterviewOrchestratorService } from "@/modules/session/orchestrator/service";
import { SessionService } from "@/modules/session/service";
import { TranscriptService } from "@/modules/session/transcript/service";
import { UserService } from "@/modules/user/service";

/** Services with no cross-service dependencies. */
const coreLayer = Layer.mergeAll(
  UserService.layer,
  InterviewService.layer,
  InterviewPlanService.layer,
  ProgressService.layer,
  GeminiLiveService.layer,
  SessionService.layer,
  TranscriptService.layer,
  GeminiService.layer,
);

/** Services that depend on the core services above. */
const dependentLayer = Layer.mergeAll(
  InterviewOrchestratorService.layer,
  EvaluationService.layer,
  PracticeService.layer,
);

/**
 * Single runtime for the whole API, built from every service layer.
 * Add each new module's service layer (and its dependencies) here.
 */
export const runtime = ManagedRuntime.make(
  Layer.provideMerge(dependentLayer, coreLayer).pipe(Layer.provide(Database.layer)),
);
