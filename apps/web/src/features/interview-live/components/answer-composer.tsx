import { Button } from "@ai-interview/ui/button";
import { Textarea } from "@ai-interview/ui/textarea";
import { Send } from "lucide-react";

export function AnswerComposer({
  value,
  onChange,
  onSubmit,
  pending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <form
      className="w-full space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Answer in your own words…"
        aria-label="Your answer"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Enter to send · Shift + Enter for a new line
        </p>
        <Button type="submit" disabled={pending || value.trim().length === 0}>
          <Send aria-hidden />
          {pending ? "Sending…" : "Send answer"}
        </Button>
      </div>
    </form>
  );
}
