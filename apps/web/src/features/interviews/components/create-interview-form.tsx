import { Button } from "@repo/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/components/card";
import { Checkbox } from "@repo/components/checkbox";
import { Input } from "@repo/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/components/select";
import { Textarea } from "@repo/components/textarea";

import { FormField } from "@/components/form-field";

import { useCreateInterview } from "../hooks/use-create-interview";

const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "lead"] as const;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export function CreateInterviewForm() {
  const { form, isSubmitting, error } = useCreateInterview();

  return (
    <Card>
      <CardHeader>
        <CardTitle>New interview</CardTitle>
        <CardDescription>Configure the role, then generate a plan in the builder.</CardDescription>
      </CardHeader>
      <CardContent>
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
                <FormField label="Title" htmlFor="title">
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
                <FormField label="Job position" htmlFor="jobPosition">
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
                <FormField label="Language" htmlFor="language">
                  <Input
                    id="language"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="en"
                  />
                </FormField>
              )}
            />
          </div>
          <form.Field
            name="jobDescription"
            children={(field) => (
              <FormField label="Job description" htmlFor="jobDescription">
                <Textarea
                  id="jobDescription"
                  value={field.state.value}
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
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Anything the interviewer should know…"
                />
              </FormField>
            )}
          />
          <div className="space-y-3">
            <p className="text-sm font-medium">Interview behavior</p>
            <form.Field
              name="allowFollowUps"
              children={(field) => (
                <label htmlFor="allow-follow-ups" className="flex items-start gap-2 text-sm">
                  <Checkbox
                    id="allow-follow-ups"
                    className="mt-0.5"
                    checked={field.state.value}
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
                    checked={field.state.value}
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
                    checked={field.state.value}
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
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, submitting]) => (
              <Button type="submit" disabled={!canSubmit || submitting || isSubmitting}>
                {isSubmitting ? "Creating…" : "Create interview"}
              </Button>
            )}
          />
          {error ? <p className="text-destructive text-sm">{error.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
