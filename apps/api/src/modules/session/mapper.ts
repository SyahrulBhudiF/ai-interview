import type { Session, TranscriptEntry, TranscriptRole } from "@ai-interview/shared";

import type {
  InterviewStage as DbInterviewStage,
  NewSession,
  NewTranscriptEntry,
  Question as DbQuestion,
  Session as DbSession,
  TranscriptEntry as DbTranscriptEntry,
} from "@/database/schema";

import type { StageNode } from "./progression";

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

/** Maps interview stage and question rows to the orchestrator's stage nodes. */
export function toStageNodes(
  stages: ReadonlyArray<DbInterviewStage>,
  questions: ReadonlyArray<DbQuestion>,
): StageNode[] {
  return stages.map((stage) => ({
    id: stage.id,
    maxFollowUps: stage.maxFollowUps,
    questions: questions
      .filter((question) => question.stageId === stage.id)
      .map((question) => ({
        id: question.id,
        stageId: question.stageId,
        text: question.text,
      })),
  }));
}

/** Builds the insert row for a newly created session. */
export function newSessionRow(interviewId: string): NewSession {
  return { id: crypto.randomUUID(), interviewId, status: "created" };
}

/** Builds the insert row for a transcript entry. */
export function newTranscriptEntryRow(
  sessionId: string,
  role: TranscriptRole,
  text: string,
  order: number,
  questionId?: string,
): NewTranscriptEntry {
  return {
    id: crypto.randomUUID(),
    sessionId,
    role,
    text,
    questionId: questionId ?? null,
    order,
  };
}
