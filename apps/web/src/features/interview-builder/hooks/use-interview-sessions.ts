import { ApiSuccessSchema, SessionWithScoreSchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useInterviewSessions(interviewId: string) {
  return useQuery({
    queryKey: ["interviews", interviewId, "sessions"],
    queryFn: async () => {
      const { data, error } = await api.interviews({ id: interviewId }).sessions.get();
      if (error || !data) throw new Error("Failed to load the sessions.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(Schema.Array(SessionWithScoreSchema)))(data)
        .data;
    },
    enabled: !import.meta.env.SSR,
  });
}
