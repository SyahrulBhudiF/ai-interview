import type { Progress } from "@ai-interview/shared";
import { desc } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { evaluationScores, evaluations, interviews, sessions } from "@/database/schema";

import { toProgress } from "./mapper";

export interface IProgressService {
  getProgress(): Effect.Effect<Progress>;
}

export class ProgressService extends Context.Service<ProgressService, IProgressService>()(
  "ai-interview/progress/ProgressService",
) {
  static readonly layer = Layer.effect(
    ProgressService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const getProgress = Effect.fn("ProgressService.getProgress")(function* () {
        const [interviewRows, sessionRows, evaluationRows, scoreRows] = yield* Effect.all(
          [
            Effect.promise(() =>
              db.select({ id: interviews.id, title: interviews.title }).from(interviews),
            ),
            Effect.promise(() =>
              db
                .select({
                  id: sessions.id,
                  interviewId: sessions.interviewId,
                  status: sessions.status,
                  createdAt: sessions.createdAt,
                })
                .from(sessions)
                .orderBy(desc(sessions.createdAt)),
            ),
            Effect.promise(() =>
              db
                .select({
                  sessionId: evaluations.sessionId,
                  overallScore: evaluations.overallScore,
                  createdAt: evaluations.createdAt,
                })
                .from(evaluations)
                .orderBy(desc(evaluations.createdAt)),
            ),
            Effect.promise(() =>
              db
                .select({ category: evaluationScores.category, score: evaluationScores.score })
                .from(evaluationScores),
            ),
          ],
          { concurrency: "unbounded" },
        );

        return toProgress({
          interviews: interviewRows,
          sessions: sessionRows,
          evaluations: evaluationRows,
          scores: scoreRows,
        });
      });

      return ProgressService.of({ getProgress });
    }),
  );
}
