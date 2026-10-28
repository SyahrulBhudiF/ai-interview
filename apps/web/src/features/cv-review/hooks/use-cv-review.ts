import { ApiSuccessSchema, CvReviewSchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useCvReview(reviewId: string) {
  return useQuery({
    queryKey: ["cv-reviews", reviewId],
    queryFn: async () => {
      const { data, error } = await api["cv-reviews"]({ id: reviewId }).get();
      if (error || !data) throw new Error("Failed to load the CV review.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(CvReviewSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });
}
