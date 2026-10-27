import { Button } from "@ai-interview/ui/button";
import { cn } from "@ai-interview/ui/utils";
import type { RealtimeMessage } from "@tanstack/ai";
import { Mic } from "lucide-react";

import { useRealtimeInterview } from "../hooks/use-realtime";

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

export function VoiceMode({ sessionId }: { sessionId: string }) {
  const realtime = useRealtimeInterview(sessionId);

  return (
    <details className="group bg-card rounded-2xl shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Mic aria-hidden className="size-4" />
          Voice mode
        </span>
        <span className="text-muted-foreground text-xs">Experimental · {realtime.status}</span>
      </summary>
      <div className="space-y-4 px-6 pb-6">
        <p className="text-muted-foreground text-sm">
          Talk to the Gemini interviewer in real time. This side channel is separate from the
          transcript above, so answers here are not recorded for the evaluation.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void realtime.connect()}
            disabled={realtime.status !== "idle" && realtime.status !== "error"}
          >
            Connect voice
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => realtime.interrupt()}
            disabled={realtime.status !== "connected"}
          >
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
        {realtime.messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing yet. Connect and start speaking.</p>
        ) : (
          <div className="space-y-2">
            {realtime.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === "assistant" ? "bg-muted/60" : "bg-accent/50",
                )}
              >
                <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {message.role}
                </p>
                <p className="text-sm">{messageText(message)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
