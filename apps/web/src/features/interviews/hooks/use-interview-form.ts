import {
  ApiSuccessSchema,
  CreateInterviewSchema,
  InterviewSchema,
  type CreateInterview,
  type Interview,
  type UpdateInterview,
} from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
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
  persona: "professional",
  jobDescription: undefined,
  context: undefined,
  allowFollowUps: true,
  generateDetailedFeedback: true,
  strictMode: false,
};

function toFormValues(interview: Interview): CreateInterview {
  return {
    title: interview.title,
    jobPosition: interview.jobPosition,
    experienceLevel: interview.experienceLevel,
    difficulty: interview.difficulty,
    language: interview.language,
    model: interview.model,
    persona: interview.persona,
    jobDescription: interview.jobDescription,
    context: interview.context,
    allowFollowUps: interview.allowFollowUps,
    generateDetailedFeedback: interview.generateDetailedFeedback,
    strictMode: interview.strictMode,
  };
}

function toUpdateInput(value: CreateInterview): UpdateInterview {
  return {
    title: value.title,
    jobPosition: value.jobPosition,
    experienceLevel: value.experienceLevel,
    jobDescription: value.jobDescription?.trim() || undefined,
    context: value.context?.trim() || undefined,
    language: value.language,
    difficulty: value.difficulty,
    model: value.model ?? "gemini-3.8-flash",
    persona: value.persona ?? "professional",
  };
}

export function useInterviewForm(interview?: Interview) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (value: CreateInterview) => {
      if (interview) {
        const { data, error } = await api
          .interviews({ id: interview.id })
          .put(toUpdateInput(value));

        if (error || !data) {
          throw new Error(getApiErrorMessage(error, "Failed to update the interview."));
        }

        return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
      }

      const { data, error } = await api.interviews.post(value);
      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to create the interview."));
      }

      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    onSuccess: (saved) => {
      toast.success(interview ? "Interview updated" : "Interview created");
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });

      if (interview) {
        queryClient.setQueryData(["interviews", interview.id], saved);
        return;
      }

      void navigate({ to: "/interviews/$interviewId", params: { interviewId: saved.id } });
    },
  });

  const form = useForm({
    defaultValues: interview ? toFormValues(interview) : defaults,
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
        persona: value.persona,
        jobDescription: value.jobDescription?.trim() || undefined,
        context: value.context?.trim() || undefined,
        allowFollowUps: value.allowFollowUps,
        generateDetailedFeedback: value.generateDetailedFeedback,
        strictMode: value.strictMode,
      });
    },
  });

  return {
    form,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
