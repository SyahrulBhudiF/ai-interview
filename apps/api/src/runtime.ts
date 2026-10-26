import { Layer, ManagedRuntime } from "effect";

import { Database } from "./database/client";
import { GeminiService } from "./modules/gemini/service";
import { InterviewService } from "./modules/interview/service";
import { UserService } from "./modules/user/service";

/**
 * Single runtime for the whole API, built from every service layer.
 * Add each new module's service layer (and its dependencies) here.
 */
export const runtime = ManagedRuntime.make(
  Layer.mergeAll(UserService.layer, InterviewService.layer, GeminiService.layer).pipe(
    Layer.provide(Database.layer),
  ),
);
