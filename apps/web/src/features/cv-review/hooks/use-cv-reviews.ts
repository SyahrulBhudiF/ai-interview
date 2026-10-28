import { ApiSuccessSchema, CvReviewSummarySchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useCvReviews() {
  return useQuery({
    queryKey: ["cv-reviews"],
    queryFn: async () => {
      const { data, error } = await api["cv-reviews"].get();
      if (error || !data) throw new Error("Failed to list CV reviews.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(Schema.Array(CvReviewSummarySchema)))(data)
        .data;
    },
    enabled: !import.meta.env.SSR,
  });
}
