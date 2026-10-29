import { Button } from "@ai-interview/ui/button";
import { Card, CardContent } from "@ai-interview/ui/card";
import { cn } from "@ai-interview/ui/utils";
import { Headphones, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";

import type { useRealtimeInterview } from "../hooks/use-realtime";

export function VoiceMode({
  realtime,
  question,
  onConnect,
}: {
  realtime: ReturnType<typeof useRealtimeInterview>;
  question: string;
  onConnect: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const connected = realtime.status === "connected";
  const connecting = realtime.status === "connecting";
  useAnimationFrame(() => {
    scale.set(reducedMotion || !connected ? 1 : 1 + Math.min(realtime.getAudioLevel(), 1) * 0.35);
  });

  const label = realtime.saving
    ? "Saving your answer…"
    : connecting
      ? "Connecting your microphone…"
      : realtime.error
        ? "Let's get you reconnected"
        : !connected
          ? "Your interviewer is ready"
          : realtime.muted
            ? "Microphone muted"
            : realtime.mode === "speaking"
              ? "Interviewer speaking"
              : realtime.mode === "thinking"
                ? "Interviewer thinking"
                : "Your turn. Take your time.";

  return (
    <Card>
      <CardContent className="space-y-7 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-primary flex items-center gap-2 font-medium">
            <Headphones aria-hidden className="size-4" />
            Voice interview
          </span>
          <span className="text-muted-foreground">
            {connected ? "Microphone connected" : "Headphones recommended"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative grid size-28 place-items-center sm:size-32" aria-hidden>
            <motion.div className="bg-primary/10 absolute inset-0 rounded-full" style={{ scale }} />
            <div
              className={cn(
                "relative grid size-20 place-items-center rounded-full transition-colors sm:size-24",
                connected && !realtime.muted
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary",
              )}
            >
              {realtime.muted ? (
                <MicOff className="size-8" />
              ) : realtime.mode === "speaking" ? (
                <Volume2 className="size-8" />
              ) : (
                <Mic className="size-8" />
              )}
            </div>
          </div>
          <output className="text-primary text-sm font-medium">{label}</output>
          <h2 className="max-w-xl text-xl leading-relaxed font-medium text-balance sm:text-2xl">
            {realtime.interviewerText || question}
          </h2>
          {!connected && !connecting ? (
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              The interviewer asks out loud. You answer naturally, with room to pause and think.
              Your spoken answers are transcribed for your debrief.
            </p>
          ) : null}
        </div>

        {realtime.candidateText ? (
          <div className="bg-accent/60 space-y-2 rounded-2xl p-4">
            <p className="text-primary text-xs font-medium">
              You · {realtime.saving ? "saving" : "live transcript, not saved yet"}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{realtime.candidateText}</p>
          </div>
        ) : null}
        {realtime.error ? (
          <p role="alert" className="text-destructive text-sm leading-relaxed">
            {realtime.error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-2">
          {realtime.error && realtime.candidateText ? (
            <Button onClick={() => void realtime.retrySave()} disabled={realtime.saving}>
              Retry saving answer
            </Button>
          ) : !connected ? (
            <Button onClick={onConnect} disabled={connecting || realtime.saving}>
              <Mic aria-hidden />
              {connecting ? "Connecting…" : "Join voice interview"}
            </Button>
          ) : (
            <>
              <Button
                variant={realtime.muted ? "default" : "secondary"}
                onClick={realtime.toggleMute}
                disabled={realtime.saving}
                aria-pressed={realtime.muted}
              >
                {realtime.muted ? <MicOff aria-hidden /> : <Mic aria-hidden />}
                {realtime.muted ? "Unmute" : "Mute"}
              </Button>
              <Button
                variant="outline"
                onClick={realtime.interrupt}
                disabled={realtime.mode !== "speaking" || realtime.saving}
              >
                Let me speak
              </Button>
              <Button
                variant="ghost"
                onClick={() => void realtime.disconnect()}
                disabled={realtime.saving}
              >
                <PhoneOff aria-hidden />
                Leave call
              </Button>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-center text-xs">
          {connected
            ? "Speak when you're ready. No send button needed."
            : "Your browser will ask for microphone permission. Audio is processed by Gemini; this app saves the text transcript, not an audio recording."}
        </p>
      </CardContent>
    </Card>
  );
}
