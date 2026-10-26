import type { InterviewPlan } from "@repo/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import {
  interviews,
  interviewStages,
  questions,
  type NewInterviewStage,
  type NewQuestion,
  type Question,
} from "@/database/schema";

export class InterviewPlanService extends Context.Service<
  InterviewPlanService,
  {
    getPlan(interviewId: string): Effect.Effect<InterviewPlan>;
    savePlan(interviewId: string, plan: InterviewPlan): Effect.Effect<InterviewPlan>;
  }
>()("ai-interview/interview/InterviewPlanService") {
  static readonly layer = Layer.effect(
    InterviewPlanService,
    Effect.gen(function* () {
      const { db } = yield* Database;

      const getPlan = Effect.fn("InterviewPlanService.getPlan")(function* (interviewId: string) {
        const stages = yield* Effect.promise(() =>
          db
            .select()
            .from(interviewStages)
            .where(eq(interviewStages.interviewId, interviewId))
            .orderBy(asc(interviewStages.order)),
        );

        if (stages.length === 0) return { stages: [] };

        const questionRows = yield* Effect.promise(() =>
          db
            .select()
            .from(questions)
            .where(
              inArray(
                questions.stageId,
                stages.map((stage) => stage.id),
              ),
            )
            .orderBy(asc(questions.order)),
        );

        const questionsByStage = new Map<string, Question[]>();
        for (const question of questionRows) {
          const list = questionsByStage.get(question.stageId) ?? [];
          list.push(question);
          questionsByStage.set(question.stageId, list);
        }

        return {
          stages: stages.map((stage) => ({
            name: stage.name,
            objective: stage.objective ?? undefined,
            competencies: stage.competencies,
            questions: (questionsByStage.get(stage.id) ?? []).map((question) => ({
              text: question.text,
              answerCriteria: question.answerCriteria ?? undefined,
              rubric: question.rubric ?? undefined,
            })),
          })),
        };
      });

      const savePlan = Effect.fn("InterviewPlanService.savePlan")(function* (
        interviewId: string,
        plan: InterviewPlan,
      ) {
        const rows = planToRows(interviewId, plan);

        yield* Effect.promise(() =>
          db.transaction(async (tx) => {
            await tx.delete(interviewStages).where(eq(interviewStages.interviewId, interviewId));
            await tx
              .update(interviews)
              .set({ status: "ready", updatedAt: new Date() })
              .where(eq(interviews.id, interviewId));

            if (rows.stages.length > 0) {
              await tx.insert(interviewStages).values(rows.stages);
            }

            if (rows.questions.length > 0) {
              await tx.insert(questions).values(rows.questions);
            }
          }),
        );

        return plan;
      });

      return InterviewPlanService.of({ getPlan, savePlan });
    }),
  );
}

/** Maps a generated `InterviewPlan` to insert rows. Orders follow array positions. */
export function planToRows(
  interviewId: string,
  plan: InterviewPlan,
): { stages: NewInterviewStage[]; questions: NewQuestion[] } {
  const stages: NewInterviewStage[] = [];
  const questionRows: NewQuestion[] = [];

  plan.stages.forEach((stage, stageIndex) => {
    const stageId = crypto.randomUUID();
    stages.push({
      id: stageId,
      interviewId,
      name: stage.name,
      objective: stage.objective ?? null,
      order: stageIndex,
      mainQuestionCount: stage.questions.length,
      maxFollowUps: 0,
      competencies: [...stage.competencies],
    });

    stage.questions.forEach((question, questionIndex) => {
      questionRows.push({
        id: crypto.randomUUID(),
        stageId,
        text: question.text,
        order: questionIndex,
        kind: "main",
        answerCriteria: question.answerCriteria ? [...question.answerCriteria] : null,
        rubric: question.rubric ?? null,
      });
    });
  });

  return { stages, questions: questionRows };
}
