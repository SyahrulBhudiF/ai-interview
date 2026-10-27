import { ApiSuccessSchema, SessionSchema } from "@ai-interview/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useStartSession(interviewId: string) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const { data: created, error: createError } = await api
        .interviews({ id: interviewId })
        .sessions.post();

      if (createError || !created)
        throw new Error(getApiErrorMessage(createError, "Failed to create the session."));

      const session = Schema.decodeUnknownSync(ApiSuccessSchema(SessionSchema))(created).data;

      const { data: started, error: startError } = await api
        .sessions({ id: session.id })
        .start.post();

      if (startError || !started)
        throw new Error(getApiErrorMessage(startError, "Failed to start the session."));

      return session.id;
    },
    onSuccess: (sessionId) => {
      void navigate({ to: "/sessions/$sessionId", params: { sessionId } });
    },
  });
}
