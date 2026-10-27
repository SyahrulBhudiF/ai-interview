import { ApiSuccessSchema, SessionDetailResponseSchema } from "@ai-interview/shared";
import { Badge } from "@ai-interview/ui/badge";
import { Button } from "@ai-interview/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { Skeleton } from "@ai-interview/ui/skeleton";
import type { RealtimeMessage } from "@tanstack/ai";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Schema } from "effect";

import { api } from "@/lib/eden";

import { useRealtimeInterview } from "./hooks/use-realtime";

function messageText(message: RealtimeMessage): string {
  const texts = message.parts
    .map((part) => {
      if (part.type === "text") return part.content;
      if (part.type === "audio") return part.transcript;
      return null;
    })
    .filter((text): text is string => Boolean(text));

  return texts.join(" ");
}

export function InterviewLivePage({ sessionId }: { sessionId: string }) {
  const realtime = useRealtimeInterview(sessionId);

  const sessionQuery = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).get();
      if (error || !data) throw new Error("Failed to load the session.");
      return Schema.decodeUnknownSync(ApiSuccessSchema(SessionDetailResponseSchema))(data).data
        .session;
    },
    enabled: !import.meta.env.SSR,
  });

  const session = sessionQuery.data;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="space-y-3">
        <Link to="/interviews" className="text-muted-foreground hover:text-foreground text-sm">
          ← Interviews
        </Link>
        {sessionQuery.isPending ? (
          <Skeleton className="h-8 w-64" />
        ) : session ? (
          <header className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Live interview</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/sessions/$sessionId/results"
                params={{ sessionId }}
                className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
              >
                View results
              </Link>
              <Badge variant={session.status === "completed" ? "secondary" : "default"}>
                {session.status}
              </Badge>
            </div>
          </header>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice session</CardTitle>
          <CardDescription>
            Connects a Gemini Live voice interviewer for this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">status: {realtime.status}</Badge>
            <Badge variant="secondary">mode: {realtime.mode}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void realtime.connect()}
              disabled={realtime.status !== "idle" && realtime.status !== "error"}
            >
              Connect voice
            </Button>
            <Button type="button" variant="secondary" onClick={() => void realtime.interrupt()}>
              Interrupt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void realtime.disconnect()}
              disabled={realtime.status === "idle"}
            >
              Disconnect
            </Button>
          </div>

          {realtime.error ? <p className="text-destructive text-sm">{realtime.error}</p> : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">Transcript</p>
            {realtime.messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing yet. Connect and start speaking.
              </p>
            ) : (
              <div className="space-y-2">
                {realtime.messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "assistant"
                        ? "bg-muted rounded-md p-3"
                        : "rounded-md border p-3"
                    }
                  >
                    <p className="text-muted-foreground text-xs uppercase">{message.role}</p>
                    <p className="text-sm">{messageText(message)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
