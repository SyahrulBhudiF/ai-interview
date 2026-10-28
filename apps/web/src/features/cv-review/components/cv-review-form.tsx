import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
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

import { useCvReviewForm } from "../hooks/use-cv-review-form";

const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "lead"] as const;

export function CvReviewForm() {
  const { form, isSubmitting, error } = useCvReviewForm();
  const models = useGeminiModels();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target role</CardTitle>
        <CardDescription>
          The review scores your CV against this role, not against a generic template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Senior Backend Engineer"
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
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="en"
                  />
                </FormField>
              )}
            />
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
                    {selected && selected.description !== selected.displayName ? (
                      <p className="text-muted-foreground text-xs">{selected.description}</p>
                    ) : null}
                  </FormField>
                );
              }}
            />
          </div>
          <form.Field
            name="jobDescription"
            children={(field) => (
              <FormField label="Job description" htmlFor="jobDescription">
                <Textarea
                  id="jobDescription"
                  value={field.state.value ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Paste the posting so the review can check the requirements against your CV."
                />
              </FormField>
            )}
          />
          <form.Field
            name="cvText"
            children={(field) => (
              <div className="space-y-2">
                <CvInput
                  value={field.state.value || undefined}
                  model={form.state.values.model}
                  required
                  onChange={(value) => field.handleChange(value ?? "")}
                />
                {field.state.meta.errors.length > 0 ? (
                  <p className="text-destructive text-xs">Add your CV to continue.</p>
                ) : null}
              </div>
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, submitting]) => (
              <Button type="submit" disabled={!canSubmit || submitting || isSubmitting}>
                {isSubmitting ? "Reviewing…" : "Review CV"}
              </Button>
            )}
          />
          {error ? <p className="text-destructive text-sm">{error.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
