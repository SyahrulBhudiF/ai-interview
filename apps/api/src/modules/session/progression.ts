/** A stage loaded from the database, with its questions in order. */
export interface StageNode {
  readonly id: string;
  readonly maxFollowUps: number;
  readonly questions: ReadonlyArray<QuestionNode>;
}

export interface QuestionNode {
  readonly id: string;
  readonly stageId: string;
  readonly text: string;
}

/** The first question of the whole plan, or null when the plan is empty. */
export function firstQuestion(stages: ReadonlyArray<StageNode>): QuestionNode | null {
  return stages[0]?.questions[0] ?? null;
}

/** The question after `currentQuestionId`, crossing stage boundaries, or null when exhausted. */
export function nextQuestion(
  stages: ReadonlyArray<StageNode>,
  currentStageId: string,
  currentQuestionId: string,
): QuestionNode | null {
  const stageIndex = stages.findIndex((stage) => stage.id === currentStageId);
  if (stageIndex === -1) return firstQuestion(stages);

  const stage = stages[stageIndex];
  if (!stage) return firstQuestion(stages);

  const questionIndex = stage.questions.findIndex((question) => question.id === currentQuestionId);
  if (questionIndex === -1) return firstQuestion(stages);

  const nextInStage = stage.questions[questionIndex + 1];
  if (nextInStage) return nextInStage;

  return stages[stageIndex + 1]?.questions[0] ?? null;
}

/** Follow-ups already asked for a question. The first AI entry is the main question itself. */
export function followUpsUsed(
  entries: ReadonlyArray<{ role: string; questionId?: string | null }>,
  questionId: string,
): number {
  const aiEntries = entries.filter(
    (entry) => entry.role === "ai" && entry.questionId === questionId,
  );

  return Math.max(0, aiEntries.length - 1);
}

/** Whether another follow-up is allowed for the stage's current question. */
export function followUpAllowed(allowFollowUps: boolean, stage: StageNode, used: number): boolean {
  return allowFollowUps && used < stage.maxFollowUps;
}
