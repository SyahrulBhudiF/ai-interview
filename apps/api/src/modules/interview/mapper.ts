import type {
  CreateInterview,
  Interview,
  InterviewSummary,
  UpdateInterview,
} from "@ai-interview/shared";

import type { Interview as DbInterview, NewInterview } from "@/database/schema";
import { decryptOptional, encryptOptional } from "@/libs/encryption";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toInterview(row: DbInterview): Interview {
  return {
    id: row.id,
    title: row.title,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as Interview["experienceLevel"],
    jobDescription: decryptOptional(row.jobDescription),
    context: decryptOptional(row.context),
    cvText: decryptOptional(row.cvText),
    language: row.language,
    difficulty: row.difficulty as Interview["difficulty"],
    status: row.status as Interview["status"],
    model: row.model,
    persona: row.persona as Interview["persona"],
    allowFollowUps: row.allowFollowUps,
    generateDetailedFeedback: row.generateDetailedFeedback,
    strictMode: row.strictMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The columns the interviews list reads; the free-text columns stay on the detail query. */
export type InterviewSummaryRow = Pick<
  DbInterview,
  | "id"
  | "title"
  | "jobPosition"
  | "experienceLevel"
  | "difficulty"
  | "status"
  | "model"
  | "createdAt"
  | "updatedAt"
>;

/** Maps a database row to the list row, which omits the candidate's free text. */
export function toInterviewSummary(row: InterviewSummaryRow): InterviewSummary {
  return {
    id: row.id,
    title: row.title,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as InterviewSummary["experienceLevel"],
    difficulty: row.difficulty as InterviewSummary["difficulty"],
    status: row.status as InterviewSummary["status"],
    model: row.model,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Builds an insert row from a create request, applying defaults. */
export function newInterviewRow(input: CreateInterview): NewInterview {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    jobPosition: input.jobPosition,
    experienceLevel: input.experienceLevel,
    jobDescription: encryptOptional(input.jobDescription),
    context: encryptOptional(input.context),
    cvText: encryptOptional(input.cvText),
    language: input.language,
    difficulty: input.difficulty,
    model: input.model ?? "gemini-3.8-flash",
    persona: input.persona ?? "professional",
    allowFollowUps: input.allowFollowUps ?? true,
    generateDetailedFeedback: input.generateDetailedFeedback ?? true,
    strictMode: input.strictMode ?? false,
  };
}

/** Builds a draft insert row that copies an existing interview's configuration. */
export function duplicateInterviewRow(source: DbInterview): NewInterview {
  return {
    id: crypto.randomUUID(),
    title: `${source.title} (copy)`,
    jobPosition: source.jobPosition,
    experienceLevel: source.experienceLevel,
    jobDescription: encryptOptional(source.jobDescription ?? undefined),
    context: encryptOptional(source.context ?? undefined),
    cvText: encryptOptional(source.cvText ?? undefined),
    language: source.language,
    difficulty: source.difficulty,
    model: source.model,
    persona: source.persona,
    allowFollowUps: source.allowFollowUps,
    generateDetailedFeedback: source.generateDetailedFeedback,
    strictMode: source.strictMode,
    status: "draft",
  };
}

/** Builds the update payload for an interview's editable configuration. */
export function interviewUpdate(input: UpdateInterview): Partial<NewInterview> {
  return {
    title: input.title,
    jobPosition: input.jobPosition,
    experienceLevel: input.experienceLevel,
    jobDescription: encryptOptional(input.jobDescription),
    context: encryptOptional(input.context),
    cvText: encryptOptional(input.cvText),
    language: input.language,
    difficulty: input.difficulty,
    model: input.model,
    persona: input.persona,
    updatedAt: new Date(),
  };
}
