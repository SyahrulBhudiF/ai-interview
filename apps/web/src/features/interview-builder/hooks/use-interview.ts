import { ApiSuccessSchema, InterviewSchema, type InterviewBehavior } from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
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
      toast.success("Behavior updated");
      queryClient.setQueryData(["interviews", interviewId], interview);
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { ...query, updateBehavior };
}
