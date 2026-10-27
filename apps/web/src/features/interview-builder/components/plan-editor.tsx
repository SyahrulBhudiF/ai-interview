import type { InterviewPlan } from "@ai-interview/shared";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardHeader } from "@ai-interview/ui/card";
import { Input } from "@ai-interview/ui/input";
import { Textarea } from "@ai-interview/ui/textarea";
import { Minus, Plus, Trash } from "lucide-react";

import { FormField } from "@/components/form-field";

type Stage = InterviewPlan["stages"][number];
type Question = Stage["questions"][number];

export function PlanEditor({
  plan,
  onChange,
}: {
  plan: InterviewPlan;
  onChange: (plan: InterviewPlan) => void;
}) {
  const updateStage = (index: number, patch: Partial<Stage>) => {
    onChange({
      stages: plan.stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)),
    });
  };

  const updateQuestion = (stageIndex: number, questionIndex: number, patch: Partial<Question>) => {
    onChange({
      stages: plan.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              questions: stage.questions.map((question, j) =>
                j === questionIndex ? { ...question, ...patch } : question,
              ),
            }
          : stage,
      ),
    });
  };

  const addStage = () =>
    onChange({
      stages: [...plan.stages, { name: "New stage", competencies: [], questions: [{ text: "" }] }],
    });

  const removeStage = (index: number) =>
    onChange({ stages: plan.stages.filter((_, i) => i !== index) });

  const setQuestionCount = (stageIndex: number, count: number) => {
    const clamped = Math.max(1, count);
    onChange({
      stages: plan.stages.map((stage, i) => {
        if (i !== stageIndex) return stage;

        if (clamped > stage.questions.length) {
          return {
            ...stage,
            questions: [
              ...stage.questions,
              ...Array.from({ length: clamped - stage.questions.length }, () => ({ text: "" })),
            ],
          };
        }

        return { ...stage, questions: stage.questions.slice(0, clamped) };
      }),
    });
  };

  const removeQuestion = (stageIndex: number, questionIndex: number) =>
    onChange({
      stages: plan.stages.map((stage, i) =>
        i === stageIndex
          ? { ...stage, questions: stage.questions.filter((_, j) => j !== questionIndex) }
          : stage,
      ),
    });

  return (
    <div className="space-y-4">
      {plan.stages.map((stage, stageIndex) => (
        // oxlint-disable-next-line react/no-array-index-key -- stages are reordered only by append/remove and are fully controlled
        <Card key={stageIndex} className="bg-muted/40 shadow-none">
          <CardHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {stageIndex + 1}
                </span>
                <Input
                  value={stage.name}
                  onChange={(e) => updateStage(stageIndex, { name: e.target.value })}
                  aria-label={`Stage ${stageIndex + 1} name`}
                  className="h-9 flex-1 font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove stage"
                  onClick={() => removeStage(stageIndex)}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Main questions</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Fewer questions"
                    disabled={stage.questions.length <= 1}
                    onClick={() => setQuestionCount(stageIndex, stage.questions.length - 1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium tabular-nums">
                    {stage.questions.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="More questions"
                    onClick={() => setQuestionCount(stageIndex, stage.questions.length + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Objective" htmlFor={`stage-${stageIndex}-objective`}>
              <Textarea
                id={`stage-${stageIndex}-objective`}
                value={stage.objective ?? ""}
                onChange={(e) =>
                  updateStage(stageIndex, { objective: e.target.value || undefined })
                }
              />
            </FormField>
            <FormField
              label="Competencies (comma-separated)"
              htmlFor={`stage-${stageIndex}-competencies`}
            >
              <Input
                id={`stage-${stageIndex}-competencies`}
                value={stage.competencies.join(", ")}
                onChange={(e) =>
                  updateStage(stageIndex, {
                    competencies: e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                  })
                }
              />
            </FormField>

            <div className="space-y-3">
              {stage.questions.map((question, questionIndex) => (
                // oxlint-disable-next-line react/no-array-index-key -- questions are fully controlled inputs with no drag reorder
                <div key={questionIndex} className="bg-card space-y-3 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Question {questionIndex + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove question"
                      onClick={() => removeQuestion(stageIndex, questionIndex)}
                    >
                      <Trash className="size-4" />
                    </Button>
                  </div>
                  <FormField label="Text" htmlFor={`q-${stageIndex}-${questionIndex}-text`}>
                    <Textarea
                      id={`q-${stageIndex}-${questionIndex}-text`}
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(stageIndex, questionIndex, { text: e.target.value })
                      }
                    />
                  </FormField>
                  <FormField
                    label="Answer criteria (one per line)"
                    htmlFor={`q-${stageIndex}-${questionIndex}-criteria`}
                  >
                    <Textarea
                      id={`q-${stageIndex}-${questionIndex}-criteria`}
                      value={(question.answerCriteria ?? []).join("\n")}
                      onChange={(e) =>
                        updateQuestion(stageIndex, questionIndex, {
                          answerCriteria: e.target.value
                            .split("\n")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Rubric" htmlFor={`q-${stageIndex}-${questionIndex}-rubric`}>
                    <Input
                      id={`q-${stageIndex}-${questionIndex}-rubric`}
                      value={question.rubric ?? ""}
                      onChange={(e) =>
                        updateQuestion(stageIndex, questionIndex, {
                          rubric: e.target.value || undefined,
                        })
                      }
                    />
                  </FormField>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addStage}>
        Add stage
      </Button>
    </div>
  );
}
