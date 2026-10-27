import type { InterviewPlan } from "@ai-interview/shared";

import type { InterviewStage, NewInterviewStage, NewQuestion, Question } from "@/database/schema";

/** Maps stage and question rows to the shared plan type. */
export function toPlan(
  stages: ReadonlyArray<InterviewStage>,
  questions: ReadonlyArray<Question>,
): InterviewPlan {
  const questionsByStage = new Map<string, Question[]>();

  for (const question of questions) {
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
}

/** Maps a generated `InterviewPlan` to insert rows. Orders follow array positions. */
export function planToRows(
  interviewId: string,
  plan: InterviewPlan,
  maxFollowUps = 0,
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
      maxFollowUps,
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
