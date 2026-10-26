import { Schema } from "effect";

export const ExperienceLevelSchema = Schema.Literals(["intern", "junior", "mid", "senior", "lead"]);
export const DifficultySchema = Schema.Literals(["beginner", "intermediate", "advanced"]);
export const InterviewStatusSchema = Schema.Literals(["draft", "ready"]);

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
  title: Schema.String,
  jobPosition: Schema.String,
  experienceLevel: ExperienceLevelSchema,
  jobDescription: Schema.optional(Schema.String),
  context: Schema.optional(Schema.String),
  language: Schema.String,
  difficulty: DifficultySchema,
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

export type Interview = Schema.Schema.Type<typeof InterviewSchema>;
export type InterviewStage = Schema.Schema.Type<typeof InterviewStageSchema>;
export type Question = Schema.Schema.Type<typeof QuestionSchema>;
export type CreateInterview = Schema.Schema.Type<typeof CreateInterviewSchema>;
export type CreateStage = Schema.Schema.Type<typeof CreateStageSchema>;
export type CreateQuestion = Schema.Schema.Type<typeof CreateQuestionSchema>;
