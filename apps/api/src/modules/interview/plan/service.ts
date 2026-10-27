import type { InterviewPlan } from "@ai-interview/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { Database } from "@/database/client";
import { interviews, interviewStages, questions } from "@/database/schema";

import { planToRows, toPlan } from "./mapper";

export interface IInterviewPlanService {
  getPlan(interviewId: string): Effect.Effect<InterviewPlan>;
  savePlan(interviewId: string, plan: InterviewPlan): Effect.Effect<InterviewPlan>;
}

export class InterviewPlanService extends Context.Service<
  InterviewPlanService,
  IInterviewPlanService
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

        return toPlan(stages, questionRows);
      });

      const savePlan = Effect.fn("InterviewPlanService.savePlan")(function* (
        interviewId: string,
        plan: InterviewPlan,
      ) {
        const interviewRows = yield* Effect.promise(() =>
          db
            .select({ allowFollowUps: interviews.allowFollowUps })
            .from(interviews)
            .where(eq(interviews.id, interviewId))
            .limit(1),
        );

        const maxFollowUps = interviewRows[0]?.allowFollowUps ? 2 : 0;
        const rows = planToRows(interviewId, plan, maxFollowUps);

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
