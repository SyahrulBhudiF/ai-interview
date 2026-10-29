import type {
  CreateCvReview,
  CvReview,
  CvReviewSummary,
  EvaluationReport,
} from "@ai-interview/shared";

import type { CvReview as DbCvReview, NewCvReview } from "@/database/schema";
import { normalizeCvHighlights } from "@/libs/cv-highlights";
import { decryptOptional, decryptText, encryptOptional, encryptText } from "@/libs/encryption";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toCvReview(row: DbCvReview): CvReview {
  return {
    id: row.id,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as CvReview["experienceLevel"],
    jobDescription: decryptOptional(row.jobDescription),
    cvText: decryptText(row.cvText),
    language: row.language,
    model: row.model,
    report: {
      ...row.report,
      cvHighlights: normalizeCvHighlights(row.report.cvHighlights),
    },
    createdAt: row.createdAt.toISOString(),
  };
}

/** Maps a row to the compact list item; the full report stays on the detail route. */
export function toCvReviewSummary(row: DbCvReview): CvReviewSummary {
  return {
    id: row.id,
    jobPosition: row.jobPosition,
    experienceLevel: row.experienceLevel as CvReviewSummary["experienceLevel"],
    overallScore: row.report.overallScore,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Builds the insert row from a review request and its generated report. */
export function newCvReviewRow(input: CreateCvReview, report: EvaluationReport): NewCvReview {
  return {
    id: crypto.randomUUID(),
    jobPosition: input.jobPosition.trim(),
    experienceLevel: input.experienceLevel,
    jobDescription: encryptOptional(input.jobDescription?.trim() || undefined),
    cvText: encryptText(input.cvText.trim()),
    language: input.language.trim(),
    model: input.model ?? "gemini-3.8-flash",
    report,
  };
}
