import { ApiSuccessSchema, GeminiModelSchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useGeminiModels() {
  return useQuery({
    queryKey: ["gemini", "models"],
    queryFn: async () => {
      const { data, error } = await api.models.get();
      if (error || !data) throw new Error("Failed to load Gemini models.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(Schema.Array(GeminiModelSchema)))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });
}
