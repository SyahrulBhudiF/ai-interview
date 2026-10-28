import { ApiSuccessSchema, DeletedCvReviewSchema } from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useDeleteCvReview(reviewId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api["cv-reviews"]({ id: reviewId }).delete();
      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to delete the review."));
      }

      return Schema.decodeUnknownSync(ApiSuccessSchema(DeletedCvReviewSchema))(data).data;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.removeQueries({ queryKey: ["cv-reviews", reviewId] });
      void queryClient.invalidateQueries({ queryKey: ["cv-reviews"] });
      void navigate({ to: "/cv-reviews" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
