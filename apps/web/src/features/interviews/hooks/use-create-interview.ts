import {
  ApiSuccessSchema,
  CreateInterviewSchema,
  InterviewSchema,
  type CreateInterview,
} from "@ai-interview/shared";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

const defaults: CreateInterview = {
  title: "",
  jobPosition: "",
  experienceLevel: "mid",
  difficulty: "intermediate",
  language: "en",
  model: "gemini-3.8-flash",
  jobDescription: undefined,
  context: undefined,
  allowFollowUps: true,
  generateDetailedFeedback: true,
  strictMode: false,
};

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (input: CreateInterview) => {
      const { data, error } = await api.interviews.post(input);
      if (error || !data)
        throw new Error(getApiErrorMessage(error, "Failed to create the interview."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    onSuccess: (interview) => {
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void navigate({ to: "/interviews/$interviewId", params: { interviewId: interview.id } });
    },
  });

  const form = useForm({
    defaultValues: defaults,
    validators: {
      onChange: Schema.toStandardSchemaV1(CreateInterviewSchema),
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        title: value.title,
        jobPosition: value.jobPosition,
        experienceLevel: value.experienceLevel,
        difficulty: value.difficulty,
        language: value.language,
        model: value.model,
        jobDescription: value.jobDescription?.trim() || undefined,
        context: value.context?.trim() || undefined,
        allowFollowUps: value.allowFollowUps,
        generateDetailedFeedback: value.generateDetailedFeedback,
        strictMode: value.strictMode,
      });
    },
  });

  return { form, isSubmitting: mutation.isPending, error: mutation.error };
}
