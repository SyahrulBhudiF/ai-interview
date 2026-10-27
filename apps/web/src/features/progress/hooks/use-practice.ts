import { ApiSuccessSchema, InterviewSchema, type EvaluationCategory } from "@ai-interview/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function usePracticeInterview() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (category: EvaluationCategory) => {
      const { data, error } = await api.practice.post({ category });
      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to create the practice interview."));
      }
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    onSuccess: (interview) => {
      void navigate({ to: "/interviews/$interviewId", params: { interviewId: interview.id } });
    },
  });
}
