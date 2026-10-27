import { ApiSuccessSchema, DeletedInterviewSchema } from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useDeleteInterview(interviewId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.interviews({ id: interviewId }).delete();
      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to delete the interview."));
      }

      return Schema.decodeUnknownSync(ApiSuccessSchema(DeletedInterviewSchema))(data).data;
    },
    onSuccess: () => {
      toast.success("Interview deleted");
      queryClient.removeQueries({ queryKey: ["interviews", interviewId] });
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void navigate({ to: "/interviews" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
