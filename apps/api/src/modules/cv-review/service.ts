import type {
  CreateCvReview,
  CvReview,
  CvReviewSummary,
  EvaluationReport,
} from "@ai-interview/shared";
import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { cvReviews } from "@/database/schema";
import { normalizeCvHighlights } from "@/libs/cv-highlights";
import type { GeminiError } from "@/modules/gemini/error";
import { GeminiService } from "@/modules/gemini/service";

import { CvReviewNotFoundError } from "./error";
import { newCvReviewRow, toCvReview, toCvReviewSummary } from "./mapper";

export interface ICvReviewService {
  review(input: CreateCvReview): Effect.Effect<CvReview, GeminiError>;
  listReviews(): Effect.Effect<ReadonlyArray<CvReviewSummary>>;
  getReview(id: string): Effect.Effect<CvReview, CvReviewNotFoundError>;
  deleteReview(id: string): Effect.Effect<{ id: string }, CvReviewNotFoundError>;
}

export class CvReviewService extends Context.Service<CvReviewService, ICvReviewService>()(
  "ai-interview/cv-review/CvReviewService",
) {
  static readonly layer = Layer.effect(
    CvReviewService,
    Effect.gen(function* () {
      const { db } = yield* Database;
      const geminiService = yield* GeminiService;

      const review = Effect.fn("CvReviewService.review")(function* (
        input: CreateCvReview,
      ): Effect.fn.Return<CvReview, GeminiError> {
        const report = yield* geminiService.generateCvReview(input);

        const rounded: EvaluationReport = {
          ...report,
          overallScore: Math.round(report.overallScore),
          scores: report.scores.map((score) => ({ ...score, score: Math.round(score.score) })),
          cvHighlights: normalizeCvHighlights(report.cvHighlights),
        };

        const inserted = yield* Effect.promise(() =>
          db.insert(cvReviews).values(newCvReviewRow(input, rounded)).returning(),
        );

        const row = inserted[0];
        if (!row) return yield* Effect.die("Expected insert to return a row");
        return toCvReview(row);
      });

      const listReviews = Effect.fn("CvReviewService.listReviews")(function* () {
        const rows = yield* Effect.promise(() =>
          db.select().from(cvReviews).orderBy(desc(cvReviews.createdAt)),
        );

        return rows.map(toCvReviewSummary);
      });

      const getReview = Effect.fn("CvReviewService.getReview")(function* (id: string) {
        const rows = yield* Effect.promise(() =>
          db.select().from(cvReviews).where(eq(cvReviews.id, id)).limit(1),
        );

        const row = rows[0];
        if (!row) return yield* new CvReviewNotFoundError({ id });
        return toCvReview(row);
      });

      const deleteReview = Effect.fn("CvReviewService.deleteReview")(function* (id: string) {
        const deleted = yield* Effect.promise(() =>
          db.delete(cvReviews).where(eq(cvReviews.id, id)).returning({ id: cvReviews.id }),
        );

        const row = deleted[0];
        if (!row) return yield* new CvReviewNotFoundError({ id });
        return row;
      });

      return CvReviewService.of({ review, listReviews, getReview, deleteReview });
    }),
  );
}
