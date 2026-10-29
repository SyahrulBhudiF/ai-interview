import { ApiSuccessSchema, InterviewSummarySchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useInterviews() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await api.interviews.get();
      if (error || !data) throw new Error("Failed to list interviews.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(Schema.Array(InterviewSummarySchema)))(data)
        .data;
    },
    enabled: !import.meta.env.SSR,
  });
}
