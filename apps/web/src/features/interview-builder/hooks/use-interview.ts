import { ApiSuccessSchema, InterviewSchema, type InterviewBehavior } from "@ai-interview/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useInterview(interviewId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["interviews", interviewId],
    queryFn: async () => {
      const { data, error } = await api.interviews({ id: interviewId }).get();
      if (error || !data) throw new Error("Failed to load the interview.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const updateBehavior = useMutation({
    mutationFn: async (behavior: InterviewBehavior) => {
      const { data, error } = await api.interviews({ id: interviewId }).behavior.put(behavior);
      if (error || !data)
        throw new Error(getApiErrorMessage(error, "Failed to update the behavior."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    onSuccess: (interview) => {
      queryClient.setQueryData(["interviews", interviewId], interview);
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });

  return { ...query, updateBehavior };
}
