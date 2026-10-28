import type { Interview } from "@ai-interview/shared";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Checkbox } from "@ai-interview/ui/checkbox";
import { Input } from "@ai-interview/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ai-interview/ui/select";
import { Textarea } from "@ai-interview/ui/textarea";

import { CvInput } from "@/components/cv-input";
import { FormField } from "@/components/form-field";
import { useGeminiModels } from "@/hooks/use-gemini-models";
import { firstErrorMessage } from "@/lib/form-error";

import { useInterviewForm } from "../hooks/use-interview-form";

const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "lead"] as const;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const PERSONAS = ["professional", "friendly", "socratic", "fast_paced"] as const;

export function InterviewForm({
  interview,
  bare = false,
}: {
  interview?: Interview;
  bare?: boolean;
}) {
  const { form, isSubmitting, isSuccess, error } = useInterviewForm(interview);
  const models = useGeminiModels();
  const isEdit = interview !== undefined;

  const submitLabel = isSubmitting
    ? isEdit
      ? "Saving…"
      : "Creating…"
    : isEdit
      ? "Save changes"
      : "Create interview";

  return (
    <Card className={bare ? "border-0 py-0 shadow-none" : undefined}>
      {bare ? null : (
        <CardHeader>
          <CardTitle>{isEdit ? "Interview settings" : "Interview setup"}</CardTitle>
          <CardDescription>
            {isEdit
              ? "Update the role and configuration. Behavior toggles live in their own card."
              : "Choose the role, constraints, and interviewer behavior."}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={bare ? "px-0" : undefined}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="title"
              children={(field) => (
                <FormField
                  label="Title"
                  htmlFor="title"
                  error={firstErrorMessage(field.state.meta.errors)}
                >
                  <Input
                    id="title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Senior Backend Engineer"
                  />
                </FormField>
              )}
            />
            <form.Field
              name="jobPosition"
              children={(field) => (
                <FormField
                  label="Job position"
                  htmlFor="jobPosition"
                  error={firstErrorMessage(field.state.meta.errors)}
                >
                  <Input
                    id="jobPosition"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Backend Engineer"
                  />
                </FormField>
              )}
            />
            <form.Field
              name="experienceLevel"
              children={(field) => (
                <FormField label="Experience level" htmlFor="experienceLevel">
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                  >
                    <SelectTrigger id="experienceLevel" className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <form.Field
              name="difficulty"
              children={(field) => (
                <FormField label="Difficulty" htmlFor="difficulty">
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                  >
                    <SelectTrigger id="difficulty" className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <form.Field
              name="language"
              children={(field) => (
                <FormField
                  label="Language"
                  htmlFor="language"
                  error={firstErrorMessage(field.state.meta.errors)}
                >
                  <Input
                    id="language"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="en"
                  />
                </FormField>
              )}
            />
            <form.Field
              name="persona"
              children={(field) => (
                <FormField label="Interviewer persona" htmlFor="persona">
                  <Select
                    value={field.state.value ?? ""}
                    onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                  >
                    <SelectTrigger id="persona" className="w-full">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONAS.map((persona) => (
                        <SelectItem key={persona} value={persona}>
                          {persona.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
          </div>
          <form.Field
            name="model"
            children={(field) => {
              const selected = models.data?.find((model) => model.name === field.state.value);

              return (
                <FormField label="Model" htmlFor="model">
                  <Select value={field.state.value ?? ""} onValueChange={field.handleChange}>
                    <SelectTrigger id="model" className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.data?.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {models.isPending ? (
                    <p className="text-muted-foreground text-xs">Loading models…</p>
                  ) : selected && selected.description !== selected.displayName ? (
                    <p className="text-muted-foreground text-xs">{selected.description}</p>
                  ) : null}
                </FormField>
              );
            }}
          />
          <form.Field
            name="jobDescription"
            children={(field) => (
              <FormField label="Job description" htmlFor="jobDescription">
                <Textarea
                  id="jobDescription"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Responsibilities, stack, and expectations…"
                />
              </FormField>
            )}
          />
          <form.Field
            name="context"
            children={(field) => (
              <FormField label="Context" htmlFor="context">
                <Textarea
                  id="context"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Anything the interviewer should know…"
                />
              </FormField>
            )}
          />
          <form.Field
            name="cvText"
            children={(field) => (
              <CvInput
                value={field.state.value}
                model={form.state.values.model}
                onChange={field.handleChange}
              />
            )}
          />
          {!isEdit ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Interview behavior</p>
              <form.Field
                name="allowFollowUps"
                children={(field) => (
                  <label htmlFor="allow-follow-ups" className="flex items-start gap-2 text-sm">
                    <Checkbox
                      id="allow-follow-ups"
                      className="mt-0.5"
                      checked={field.state.value ?? false}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <span className="space-y-0.5">
                      <span className="block font-medium">Allow dynamic follow-up questions</span>
                      <span className="text-muted-foreground block">
                        The interviewer may ask follow-ups beyond the main questions.
                      </span>
                    </span>
                  </label>
                )}
              />
              <form.Field
                name="generateDetailedFeedback"
                children={(field) => (
                  <label
                    htmlFor="generate-detailed-feedback"
                    className="flex items-start gap-2 text-sm"
                  >
                    <Checkbox
                      id="generate-detailed-feedback"
                      className="mt-0.5"
                      checked={field.state.value ?? false}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <span className="space-y-0.5">
                      <span className="block font-medium">Generate detailed feedback</span>
                      <span className="text-muted-foreground block">
                        Produce a full evaluation report after the interview.
                      </span>
                    </span>
                  </label>
                )}
              />
              <form.Field
                name="strictMode"
                children={(field) => (
                  <label htmlFor="strict-mode" className="flex items-start gap-2 text-sm">
                    <Checkbox
                      id="strict-mode"
                      className="mt-0.5"
                      checked={field.state.value ?? false}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                    />
                    <span className="space-y-0.5">
                      <span className="block font-medium">Strict interviewer mode</span>
                      <span className="text-muted-foreground block">
                        Direct, no-hints interviewing that challenges weak answers.
                      </span>
                    </span>
                  </label>
                )}
              />
            </div>
          ) : null}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, submitting]) => (
              <Button type="submit" disabled={!canSubmit || submitting || isSubmitting}>
                {submitLabel}
              </Button>
            )}
          />
          {isEdit && isSuccess && !isSubmitting ? (
            <p className="text-sm font-medium text-green-600">Saved.</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
