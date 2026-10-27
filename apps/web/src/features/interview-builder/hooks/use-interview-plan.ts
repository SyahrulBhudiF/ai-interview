import {
  ApiSuccessSchema,
  InterviewPlanSchema,
  type InterviewPlan,
  type StageSpec,
} from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useInterviewPlan(interviewId: string) {
  const queryClient = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["interviews", interviewId, "plan"],
    queryFn: async () => {
      const { data, error } = await api.interviews({ id: interviewId }).plan.get();
      if (error || !data) throw new Error("Failed to load the plan.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewPlanSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const generate = useMutation({
    mutationFn: async (stages: StageSpec[]) => {
      const { data, error } = await api.interviews({ id: interviewId })["generate-plan"].post({
        stages,
      });

      if (error || !data)
        throw new Error(getApiErrorMessage(error, "Failed to generate the plan."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewPlanSchema))(data).data;
    },
    onSuccess: () => {
      toast.success("Plan generated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const save = useMutation({
    mutationFn: async (plan: InterviewPlan) => {
      const { data, error } = await api.interviews({ id: interviewId }).plan.put(plan);
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to save the plan."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewPlanSchema))(data).data;
    },
    onSuccess: () => {
      toast.success("Plan saved");
      void queryClient.invalidateQueries({ queryKey: ["interviews", interviewId, "plan"] });
      void queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { planQuery, generate, save };
}
