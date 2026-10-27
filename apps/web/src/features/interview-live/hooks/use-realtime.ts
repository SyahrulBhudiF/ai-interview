import { ApiSuccessSchema, RealtimeTokenResponseSchema } from "@ai-interview/shared";
import type { RealtimeMessage, RealtimeMode, RealtimeStatus, RealtimeToken } from "@tanstack/ai";
import { RealtimeClient } from "@tanstack/ai-client";
import { geminiRealtime } from "@tanstack/ai-gemini";
import { Schema } from "effect";
import { useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/eden";

export function useRealtimeInterview(sessionId: string) {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [mode, setMode] = useState<RealtimeMode>("idle");
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<RealtimeClient | null>(null);

  const connect = async () => {
    setError(null);

    const client = new RealtimeClient({
      getToken: async (): Promise<RealtimeToken> => {
        const tokenClient = api.sessions({ id: sessionId })["realtime-token"];
        const { data, error: tokenError } = await tokenClient.post();

        if (tokenError || !data)
          throw new Error(getApiErrorMessage(tokenError, "Failed to get a live token."));

        return Schema.decodeUnknownSync(ApiSuccessSchema(RealtimeTokenResponseSchema))(data)
          .data as unknown as RealtimeToken;
      },
      adapter: geminiRealtime(),
      onStatusChange: setStatus,
      onModeChange: setMode,
      onMessage: (message) => setMessages((prev) => [...prev, message]),
      onError: (err) => setError(err.message),
    });

    clientRef.current = client;
    await client.connect();
  };

  const disconnect = async () => {
    await clientRef.current?.disconnect();
  };

  const interrupt = () => clientRef.current?.interrupt();

  useEffect(() => {
    return () => {
      void clientRef.current?.destroy();
    };
  }, []);

  return { status, mode, messages, error, connect, disconnect, interrupt };
}
