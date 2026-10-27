import { ApiSuccessSchema, ProgressSchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useProgress() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data, error } = await api.progress.get();
      if (error || !data) throw new Error(getApiErrorMessage(error, "Failed to load progress."));
      return Schema.decodeUnknownSync(ApiSuccessSchema(ProgressSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });
}
