import {
  ApiSuccessSchema,
  CreateCvReviewSchema,
  CvReviewSchema,
  type CreateCvReview,
} from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

const defaults: CreateCvReview = {
  jobPosition: "",
  experienceLevel: "mid",
  jobDescription: undefined,
  cvText: "",
  language: "en",
  model: "gemini-3.8-flash",
};

export function useCvReviewForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (value: CreateCvReview) => {
      const { data, error } = await api["cv-reviews"].post(value);
      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to review the CV."));
      }

      return Schema.decodeUnknownSync(ApiSuccessSchema(CvReviewSchema))(data).data;
    },
    onSuccess: (review) => {
      toast.success("CV review ready");
      queryClient.setQueryData(["cv-reviews", review.id], review);
      void queryClient.invalidateQueries({ queryKey: ["cv-reviews"] });
      void navigate({ to: "/cv-reviews/$reviewId", params: { reviewId: review.id } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: defaults,
    validators: {
      onChange: Schema.toStandardSchemaV1(CreateCvReviewSchema),
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        jobPosition: value.jobPosition.trim(),
        experienceLevel: value.experienceLevel,
        jobDescription: value.jobDescription?.trim() || undefined,
        cvText: value.cvText.trim(),
        language: value.language.trim() || "en",
        model: value.model,
      });
    },
  });

  return { form, isSubmitting: mutation.isPending, error: mutation.error };
}
