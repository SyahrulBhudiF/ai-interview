import {
  ApiSuccessSchema,
  RealtimeTokenResponseSchema,
  SessionAnswerResponseSchema,
} from "@ai-interview/shared";
import { geminiRealtime } from "@tanstack/ai-gemini";
import { useQueryClient } from "@tanstack/react-query";
import { Schema } from "effect";
import { useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

import { initialVoiceState, VoiceInterview } from "../voice-interview";

export function useRealtimeInterview(sessionId: string) {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState({ sessionId, state: initialVoiceState });
  const controllerRef = useRef<VoiceInterview | null>(null);
  useEffect(() => {
    const controller = new VoiceInterview({
      adapter: geminiRealtime(),
      getToken: async () => {
        const { data, error } = await api.sessions({ id: sessionId })["realtime-token"].post();
        if (error || !data)
          throw new Error(getApiErrorMessage(error, "Could not reach the voice interviewer."));
        return Schema.decodeUnknownSync(ApiSuccessSchema(RealtimeTokenResponseSchema))(data).data;
      },
      saveAnswer: async (answer) => {
        const { data, error } = await api.sessions({ id: sessionId }).answer.post(answer);
        if (error || !data)
          throw new Error(getApiErrorMessage(error, "Could not save your spoken answer."));
        return Schema.decodeUnknownSync(ApiSuccessSchema(SessionAnswerResponseSchema))(data).data;
      },
      onChange: (state) => setSnapshot({ sessionId, state }),
      onSaved: () => {
        void queryClient.invalidateQueries({ queryKey: ["sessions", sessionId], exact: true });
        void queryClient.invalidateQueries({ queryKey: ["interviews"] });
        void queryClient.invalidateQueries({ queryKey: ["progress"] });
      },
    });

    controllerRef.current = controller;
    return () => {
      void controller.disconnect();
      controllerRef.current = null;
    };
  }, [sessionId, queryClient]);

  return {
    ...(snapshot.sessionId === sessionId ? snapshot.state : initialVoiceState),
    connect: (replyTo: string) => controllerRef.current?.connect(replyTo),
    disconnect: () => controllerRef.current?.disconnect(),
    toggleMute: () => controllerRef.current?.toggleMute(),
    takeDraft: () => controllerRef.current?.takeDraft() ?? "",
    interrupt: () => controllerRef.current?.interrupt(),
    retrySave: () => controllerRef.current?.submitAnswer(),
    getAudioLevel: () => controllerRef.current?.getAudioLevel() ?? 0,
  };
}
