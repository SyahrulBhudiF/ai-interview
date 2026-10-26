import { Layer, ManagedRuntime } from "effect";

import { Database } from "./database/client";
import { UserService } from "./modules/user/service";

/**
 * Single runtime for the whole API, built from every service layer.
 * Add each new module's service layer (and its dependencies) here.
 */
export const runtime = ManagedRuntime.make(UserService.layer.pipe(Layer.provide(Database.layer)));
