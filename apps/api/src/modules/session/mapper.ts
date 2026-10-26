import type { Session, TranscriptEntry } from "@ai-interview/shared";

import type { Session as DbSession, TranscriptEntry as DbTranscriptEntry } from "@/database/schema";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toSession(row: DbSession): Session {
  return {
    id: row.id,
    interviewId: row.interviewId,
    status: row.status as Session["status"],
    currentStageId: row.currentStageId ?? undefined,
    currentQuestionId: row.currentQuestionId ?? undefined,
    startedAt: row.startedAt?.toISOString(),
    endedAt: row.endedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toTranscriptEntry(row: DbTranscriptEntry): TranscriptEntry {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role as TranscriptEntry["role"],
    text: row.text,
    questionId: row.questionId ?? undefined,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
  };
}
