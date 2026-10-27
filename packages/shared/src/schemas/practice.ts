import { Schema } from "effect";

import { EvaluationCategorySchema } from "./evaluation";

/** Body for creating a practice interview focused on one weak competency. */
export const PracticeRequestSchema = Schema.Struct({
  category: EvaluationCategorySchema,
});

export type PracticeRequest = Schema.Schema.Type<typeof PracticeRequestSchema>;
