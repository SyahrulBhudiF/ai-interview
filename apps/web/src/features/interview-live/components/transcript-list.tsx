import type { TranscriptEntry } from "@ai-interview/shared";
import { cn } from "@ai-interview/ui/utils";
import { useEffect, useRef } from "react";

function Bubble({ entry }: { entry: TranscriptEntry }) {
  const isAi = entry.role === "ai";

  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isAi ? "bg-muted/60 self-start" : "bg-accent/50 self-end",
      )}
    >
      <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
        {isAi ? "Interviewer" : "You"}
      </p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
    </div>
  );
}

export function TranscriptList({
  transcript,
  pending,
}: {
  transcript: ReadonlyArray<TranscriptEntry>;
  pending: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the effect reads the ref; it reruns when the transcript grows
  }, [transcript.length]);

  return (
    <div ref={listRef} className="flex max-h-[46vh] min-h-24 flex-col gap-3 overflow-y-auto pr-1">
      {transcript.length === 0 ? (
        <p className="text-muted-foreground text-sm">Waiting for the first question…</p>
      ) : (
        transcript.map((entry) => <Bubble key={entry.id} entry={entry} />)
      )}
      {pending ? (
        <div className="bg-muted/60 max-w-[85%] self-start rounded-2xl px-4 py-3">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
            Interviewer
          </p>
          <p className="text-muted-foreground text-sm">Thinking…</p>
        </div>
      ) : null}
    </div>
  );
}
