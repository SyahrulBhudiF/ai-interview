import type { TranscriptEntry } from "@ai-interview/shared";
import { cn } from "@ai-interview/ui/utils";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

function Bubble({ entry }: { entry: TranscriptEntry }) {
  const isAi = entry.role === "ai";
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "max-w-[92%] rounded-2xl px-4 py-4 break-words sm:max-w-[85%]",
        isAi ? "bg-muted/60 self-start rounded-tl-sm" : "bg-accent/60 self-end rounded-tr-sm",
      )}
    >
      <p className="text-primary mb-2 text-xs font-medium">{isAi ? "Interviewer" : "You"}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
    </motion.div>
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
          <p className="text-primary text-xs font-medium">Interviewer</p>
          <output className="text-muted-foreground mt-1 block text-sm">Reading your answer…</output>
        </div>
      ) : null}
    </div>
  );
}
