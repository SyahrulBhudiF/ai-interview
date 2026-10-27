import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { evaluationScores, evaluations, interviews, sessions } from "@/database/schema";
import { ProgressService } from "@/modules/progress/service";

const interviewRows = [
  { id: "interview-1", title: "Backend Engineer" },
  { id: "interview-2", title: "Frontend Engineer" },
];

const sessionRows = [
  {
    id: "session-2",
    interviewId: "interview-1",
    status: "completed",
    createdAt: new Date("2026-03-02T00:00:00.000Z"),
  },
  {
    id: "session-1",
    interviewId: "interview-1",
    status: "completed",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
  },
  {
    id: "session-3",
    interviewId: "interview-2",
    status: "in_progress",
    createdAt: new Date("2026-03-03T00:00:00.000Z"),
  },
];

const evaluationRows = [
  { sessionId: "session-2", overallScore: 60, createdAt: new Date("2026-03-02T12:00:00.000Z") },
  { sessionId: "session-1", overallScore: 80, createdAt: new Date("2026-03-01T12:00:00.000Z") },
];

const scoreRows = [
  { category: "technical_knowledge", score: 4 },
  { category: "technical_knowledge", score: 3 },
  { category: "communication", score: 2 },
  { category: "problem_solving", score: 5 },
];

function stubDatabase(rowsByTable: ReadonlyMap<unknown, ReadonlyArray<unknown>>) {
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const rows = Promise.resolve(rowsByTable.get(table) ?? []);
        return {
          orderBy: () => rows,
          then: (
            resolve: (value: ReadonlyArray<unknown>) => unknown,
            reject: (reason: unknown) => unknown,
          ) => rows.then(resolve, reject),
        };
      },
    }),
  } as unknown as Database["Service"]["db"];

  return Layer.succeed(Database, Database.of({ db }));
}

function stubLayer(
  evaluationsRows: ReadonlyArray<unknown>,
  scoreTableRows: ReadonlyArray<unknown>,
) {
  return stubDatabase(
    new Map<unknown, ReadonlyArray<unknown>>([
      [interviews, interviewRows],
      [sessions, sessionRows],
      [evaluations, evaluationsRows],
      [evaluationScores, scoreTableRows],
    ]),
  );
}

describe("ProgressService.getProgress", () => {
  it.effect("aggregates score history and competency averages", () => {
    const provide = ProgressService.layer.pipe(Layer.provide(stubLayer(evaluationRows, scoreRows)));

    return Effect.gen(function* () {
      const progress = yield* ProgressService.use((service) => service.getProgress());

      assert.deepStrictEqual(progress.summary, {
        interviews: 2,
        sessions: 3,
        completedSessions: 2,
        evaluatedSessions: 2,
        averageScore: 70,
      });

      assert.deepStrictEqual(
        progress.scoreHistory.map((entry) => [
          entry.sessionId,
          entry.interviewTitle,
          entry.overallScore,
        ]),
        [
          ["session-2", "Backend Engineer", 60],
          ["session-1", "Backend Engineer", 80],
        ],
      );

      assert.deepStrictEqual(progress.competencyAverages, [
        { category: "communication", average: 2, count: 1 },
        { category: "technical_knowledge", average: 3.5, count: 2 },
        { category: "problem_solving", average: 5, count: 1 },
      ]);
    }).pipe(Effect.provide(provide));
  });

  it.effect("returns an empty dashboard when nothing has been evaluated", () => {
    const provide = ProgressService.layer.pipe(Layer.provide(stubLayer([], [])));

    return Effect.gen(function* () {
      const progress = yield* ProgressService.use((service) => service.getProgress());

      assert.deepStrictEqual(progress.summary, {
        interviews: 2,
        sessions: 3,
        completedSessions: 2,
        evaluatedSessions: 0,
        averageScore: undefined,
      });
      assert.deepStrictEqual(progress.scoreHistory, []);
      assert.deepStrictEqual(progress.competencyAverages, []);
    }).pipe(Effect.provide(provide));
  });
});
