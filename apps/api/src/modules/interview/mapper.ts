import type {
  CreateInterview,
  Interview,
  InterviewSummary,
  UpdateInterview,
} from "@ai-interview/shared";

import type { Interview as DbInterview, NewInterview } from "@/database/schema";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toInterview(row: DbInterview): Interview {
  return {
    id: row.id,
    title: row.title,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as Interview["experienceLevel"],
    jobDescription: row.jobDescription ?? undefined,
    context: row.context ?? undefined,
    cvText: row.cvText ?? undefined,
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

/** Maps a database row to the list row, which omits the candidate's free text. */
export function toInterviewSummary(
  row: Pick<
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
  >,
): InterviewSummary {
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
    jobDescription: input.jobDescription ?? null,
    context: input.context ?? null,
    cvText: input.cvText ?? null,
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
    jobDescription: source.jobDescription,
    context: source.context,
    cvText: source.cvText,
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
    jobDescription: input.jobDescription ?? null,
    context: input.context ?? null,
    cvText: input.cvText ?? null,
    language: input.language,
    difficulty: input.difficulty,
    model: input.model,
    persona: input.persona,
    updatedAt: new Date(),
  };
}
