import type { EvaluationPoint } from "@ai-interview/shared";
import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  jobPosition: text("job_position").notNull(),
  experienceLevel: text("experience_level").notNull(),
  jobDescription: text("job_description"),
  context: text("context"),
  cvText: text("cv_text"),
  language: text("language").notNull().default("en"),
  difficulty: text("difficulty").notNull().default("intermediate"),
  status: text("status").notNull().default("draft"),
  model: text("model").notNull().default("gemini-3.8-flash"),
  persona: text("persona").notNull().default("professional"),
  allowFollowUps: boolean("allow_follow_ups").notNull().default(true),
  generateDetailedFeedback: boolean("generate_detailed_feedback").notNull().default(true),
  strictMode: boolean("strict_mode").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const interviewStages = pgTable("interview_stages", {
  id: text("id").primaryKey(),
  interviewId: text("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objective: text("objective"),
  order: integer("order").notNull(),
  mainQuestionCount: integer("main_question_count").notNull().default(1),
  maxFollowUps: integer("max_follow_ups").notNull().default(0),
  competencies: jsonb("competencies").$type<string[]>().notNull().default([]),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  stageId: text("stage_id")
    .notNull()
    .references(() => interviewStages.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  order: integer("order").notNull(),
  kind: text("kind").notNull().default("main"),
  answerCriteria: jsonb("answer_criteria").$type<string[]>(),
  rubric: text("rubric"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  interviewId: text("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("created"),
  currentStageId: text("current_stage_id"),
  currentQuestionId: text("current_question_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transcriptEntries = pgTable("transcript_entries", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  text: text("text").notNull(),
  questionId: text("question_id").references(() => questions.id, { onDelete: "set null" }),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  summary: text("summary").notNull(),
  strengths: jsonb("strengths").$type<EvaluationPoint[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<EvaluationPoint[]>().notNull().default([]),
  recommendations: jsonb("recommendations").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evaluationScores = pgTable("evaluation_scores", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  stageId: text("stage_id"),
  questionId: text("question_id"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type InterviewStage = typeof interviewStages.$inferSelect;
export type NewInterviewStage = typeof interviewStages.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type TranscriptEntry = typeof transcriptEntries.$inferSelect;
export type NewTranscriptEntry = typeof transcriptEntries.$inferInsert;
export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;
export type EvaluationScore = typeof evaluationScores.$inferSelect;
export type NewEvaluationScore = typeof evaluationScores.$inferInsert;
