import { Schema } from "effect";

import { boundedNonEmptyString, boundedString, TEXT_LIMITS } from "./limits";

export const ExperienceLevelSchema = Schema.Literals(["intern", "junior", "mid", "senior", "lead"]);
export const DifficultySchema = Schema.Literals(["beginner", "intermediate", "advanced"]);
export const InterviewStatusSchema = Schema.Literals(["draft", "ready"]);
export const PersonaSchema = Schema.Literals([
  "professional",
  "friendly",
  "socratic",
  "fast_paced",
]);

export const InterviewSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  jobPosition: Schema.String,
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  cvText: Schema.optional(Schema.String),
  language: Schema.String,
  difficulty: DifficultySchema,
  status: InterviewStatusSchema,
  model: Schema.String,
  persona: PersonaSchema,
  allowFollowUps: Schema.Boolean,
  generateDetailedFeedback: Schema.Boolean,
  strictMode: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

/**
 * A row in the interviews list. The list never carries the candidate's CV, the
 * job description, or the free-form context — those stay on the detail endpoint.
 */
export const InterviewSummarySchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  jobPosition: Schema.String,
  experienceLevel: ExperienceLevelSchema,
  difficulty: DifficultySchema,
  status: InterviewStatusSchema,
  model: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const InterviewStageSchema = Schema.Struct({
  id: Schema.String,
  interviewId: Schema.String,
  name: Schema.String,
  objective: Schema.optional(Schema.String),
  order: Schema.Number,
  mainQuestionCount: Schema.Number,
  maxFollowUps: Schema.Number,
  competencies: Schema.Array(Schema.String),
});

export const QuestionKindSchema = Schema.Literals(["main", "follow-up"]);

export const QuestionSchema = Schema.Struct({
  id: Schema.String,
  stageId: Schema.String,
  text: Schema.String,
  order: Schema.Number,
  kind: QuestionKindSchema,
  answerCriteria: Schema.optional(Schema.Array(Schema.String)),
  rubric: Schema.optional(Schema.String),
});

export const CreateInterviewSchema = Schema.Struct({
  title: boundedNonEmptyString(TEXT_LIMITS.title),
  jobPosition: boundedNonEmptyString(TEXT_LIMITS.jobPosition),
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(boundedString(TEXT_LIMITS.jobDescription)),
  context: Schema.optional(boundedString(TEXT_LIMITS.context)),
  cvText: Schema.optional(boundedString(TEXT_LIMITS.cvText)),
  language: boundedNonEmptyString(TEXT_LIMITS.language),
  difficulty: DifficultySchema,
  model: Schema.optional(boundedNonEmptyString(TEXT_LIMITS.model)),
  persona: Schema.optional(PersonaSchema),
  allowFollowUps: Schema.optional(Schema.Boolean),
  generateDetailedFeedback: Schema.optional(Schema.Boolean),
  strictMode: Schema.optional(Schema.Boolean),
});

export const CreateStageSchema = Schema.Struct({
  name: Schema.String,
  objective: Schema.optional(Schema.String),
  mainQuestionCount: Schema.Number,
  maxFollowUps: Schema.Number,
  competencies: Schema.Array(Schema.String),
});

export const CreateQuestionSchema = Schema.Struct({
  text: Schema.String,
  answerCriteria: Schema.optional(Schema.Array(Schema.String)),
  rubric: Schema.optional(Schema.String),
});

/** A stage the user defines before generation: a name and how many main questions it needs. */
export const StageSpecSchema = Schema.Struct({
  name: boundedNonEmptyString(TEXT_LIMITS.stageName),
  mainQuestionCount: Schema.Int.check(
    Schema.isBetween({ minimum: 1, maximum: TEXT_LIMITS.questionsPerStage }),
  ),
});

/** Body for generate-plan: the stage structure Gemini should fill with questions. */
export const GeneratePlanRequestSchema = Schema.Struct({
  stages: Schema.Array(StageSpecSchema).check(Schema.isMaxLength(TEXT_LIMITS.stages)),
});

/** Interview behavior settings — editable independently from the plan. */
export const InterviewBehaviorSchema = Schema.Struct({
  allowFollowUps: Schema.Boolean,
  generateDetailedFeedback: Schema.Boolean,
  strictMode: Schema.Boolean,
});

/** Body for replacing an interview's editable configuration. */
export const UpdateInterviewSchema = Schema.Struct({
  title: boundedNonEmptyString(TEXT_LIMITS.title),
  jobPosition: boundedNonEmptyString(TEXT_LIMITS.jobPosition),
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(boundedString(TEXT_LIMITS.jobDescription)),
  context: Schema.optional(boundedString(TEXT_LIMITS.context)),
  cvText: Schema.optional(boundedString(TEXT_LIMITS.cvText)),
  language: boundedNonEmptyString(TEXT_LIMITS.language),
  difficulty: DifficultySchema,
  model: boundedNonEmptyString(TEXT_LIMITS.model),
  persona: PersonaSchema,
});

export const DeletedInterviewSchema = Schema.Struct({ id: Schema.String });

export type Interview = Schema.Schema.Type<typeof InterviewSchema>;
export type InterviewSummary = Schema.Schema.Type<typeof InterviewSummarySchema>;
export type Persona = Schema.Schema.Type<typeof PersonaSchema>;
export type InterviewStage = Schema.Schema.Type<typeof InterviewStageSchema>;
export type Question = Schema.Schema.Type<typeof QuestionSchema>;
export type CreateInterview = Schema.Schema.Type<typeof CreateInterviewSchema>;
export type CreateStage = Schema.Schema.Type<typeof CreateStageSchema>;
export type CreateQuestion = Schema.Schema.Type<typeof CreateQuestionSchema>;
export type StageSpec = Schema.Schema.Type<typeof StageSpecSchema>;
export type GeneratePlanRequest = Schema.Schema.Type<typeof GeneratePlanRequestSchema>;
export type InterviewBehavior = Schema.Schema.Type<typeof InterviewBehaviorSchema>;
export type UpdateInterview = Schema.Schema.Type<typeof UpdateInterviewSchema>;
export type DeletedInterview = Schema.Schema.Type<typeof DeletedInterviewSchema>;
