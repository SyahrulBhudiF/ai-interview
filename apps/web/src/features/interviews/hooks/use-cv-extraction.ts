import { ApiSuccessSchema, CvExtractionSchema } from "@ai-interview/shared";
import { toast } from "@ai-interview/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useCvExtraction() {
  return useMutation({
    mutationFn: async ({ file, model }: { file: File; model?: string }) => {
      const { data, error } = await (model
        ? api.cv.extract.post({ file, model })
        : api.cv.extract.post({ file }));

      if (error || !data) {
        throw new Error(getApiErrorMessage(error, "Failed to read the CV."));
      }

      return Schema.decodeUnknownSync(ApiSuccessSchema(CvExtractionSchema))(data).data;
    },
    onSuccess: () => {
      toast.success("CV added");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
