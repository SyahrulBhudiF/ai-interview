import {
  ApiSuccessSchema,
  InterviewPlanSchema,
  InterviewSchema,
  SessionAnswerResponseSchema,
  SessionDetailResponseSchema,
  SessionSchema,
  SessionStartResponseSchema,
  type AnswerRequest,
} from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useSessionDetail(sessionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).get();
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to load the session."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionDetailResponseSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["sessions", sessionId], exact: true });
  };

  const start = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).start.post();
      if (error || !data)
        throw new Error(getApiErrorMessage(error, "Failed to start the session."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionStartResponseSchema))(data).data;
    },
    onSuccess: () => {
      refresh();
      toast.success("Interview started");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const answer = useMutation({
    mutationFn: async (request: AnswerRequest) => {
      const { data, error } = await api.sessions({ id: sessionId }).answer.post(request);
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to send the answer."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionAnswerResponseSchema))(data).data;
    },
    onSuccess: (result) => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["interviews"], exact: false });
      if (result.finished) {
        toast.success("Interview complete");
        void queryClient.invalidateQueries({ queryKey: ["progress"] });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const end = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).end.post();
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to end the session."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionSchema))(data).data;
    },
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
      toast.success("Interview ended");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { ...query, start, answer, end };
}

/** The interview and its plan, used for the title and the question progress. */
export function useInterviewContext(interviewId: string | undefined) {
  const interview = useQuery({
    queryKey: ["interviews", interviewId],
    queryFn: async () => {
      if (!interviewId) throw new Error("Missing interview id");
      const { data, error } = await api.interviews({ id: interviewId }).get();
      if (error || !data) throw new Error("Failed to load the interview.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    enabled: Boolean(interviewId) && !import.meta.env.SSR,
  });

  const plan = useQuery({
    queryKey: ["interviews", interviewId, "plan"],
    queryFn: async () => {
      if (!interviewId) throw new Error("Missing interview id");
      const { data, error } = await api.interviews({ id: interviewId }).plan.get();
      if (error || !data) throw new Error("Failed to load the plan.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewPlanSchema))(data).data;
    },
    enabled: Boolean(interviewId) && !import.meta.env.SSR,
  });

  return { interview, plan };
}
