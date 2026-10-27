import { ApiSuccessSchema, InterviewSchema } from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useDuplicateInterview(interviewId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.interviews({ id: interviewId }).duplicate.post();
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to duplicate."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    onSuccess: (interview) => {
      toast.success("Interview duplicated");
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
      void navigate({ to: "/interviews/$interviewId", params: { interviewId: interview.id } });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
