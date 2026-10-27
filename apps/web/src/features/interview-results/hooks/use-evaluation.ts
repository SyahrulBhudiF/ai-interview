import { ApiSuccessSchema, EvaluationReportSchema } from "@ai-interview/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useEvaluation(sessionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sessions", sessionId, "evaluation"],
    queryFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).evaluation.get();

      if (error) {
        if (error.status === 404) return null;
        throw new Error(getApiErrorMessage(error, "Failed to load the evaluation."));
      }

      if (!data) return null;
      return Schema.decodeUnknownSync(ApiSuccessSchema(EvaluationReportSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const evaluate = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).evaluate.post();
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to evaluate."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(EvaluationReportSchema))(data).data;
    },
    onSuccess: (report) => {
      queryClient.setQueryData(["sessions", sessionId, "evaluation"], report);
    },
  });

  return { ...query, evaluate };
}
