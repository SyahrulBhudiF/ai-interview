import type { Interview } from "@repo/shared";

import type { Interview as DbInterview } from "@/database/schema";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toInterview(row: DbInterview): Interview {
  return {
    id: row.id,
    title: row.title,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as Interview["experienceLevel"],
    jobDescription: row.jobDescription ?? undefined,
    context: row.context ?? undefined,
    language: row.language,
    difficulty: row.difficulty as Interview["difficulty"],
    status: row.status as Interview["status"],
    allowFollowUps: row.allowFollowUps,
    generateDetailedFeedback: row.generateDetailedFeedback,
    strictMode: row.strictMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
