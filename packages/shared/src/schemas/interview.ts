import { Schema } from "effect";

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
  title: Schema.NonEmptyString,
  jobPosition: Schema.NonEmptyString,
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  language: Schema.NonEmptyString,
  difficulty: DifficultySchema,
  model: Schema.optional(Schema.String),
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
  name: Schema.String,
  mainQuestionCount: Schema.Number,
});

/** Body for generate-plan: the stage structure Gemini should fill with questions. */
export const GeneratePlanRequestSchema = Schema.Struct({
  stages: Schema.Array(StageSpecSchema),
});

/** Interview behavior settings — editable independently from the plan. */
export const InterviewBehaviorSchema = Schema.Struct({
  allowFollowUps: Schema.Boolean,
  generateDetailedFeedback: Schema.Boolean,
  strictMode: Schema.Boolean,
});

/** Body for replacing an interview's editable configuration. */
export const UpdateInterviewSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  jobPosition: Schema.NonEmptyString,
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  language: Schema.NonEmptyString,
  difficulty: DifficultySchema,
  model: Schema.String,
  persona: PersonaSchema,
});

export const DeletedInterviewSchema = Schema.Struct({ id: Schema.String });

export type Interview = Schema.Schema.Type<typeof InterviewSchema>;
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
