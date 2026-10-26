import { ApiSuccessSchema, InterviewSchema } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useInterview(interviewId: string) {
  return useQuery({
    queryKey: ["interviews", interviewId],
    queryFn: async () => {
      const { data, error } = await api.api.interviews({ id: interviewId }).get();
      if (error || !data) throw new Error("Failed to load the interview.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(InterviewSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });
}
