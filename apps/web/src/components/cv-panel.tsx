import type { CvHighlight } from "@ai-interview/shared";
import { Button } from "@ai-interview/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ai-interview/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ai-interview/ui/dialog";
import { cn } from "@ai-interview/ui/utils";
import { Maximize2 } from "lucide-react";

import { CvDocument } from "./cv-document";

function HighlightLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[11px]">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="bg-success/40 size-2 rounded-full" />
        Strong
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="bg-warning/50 size-2 rounded-full" />
        Needs work
      </span>
      <span className="text-muted-foreground/70">Hover or tap for why</span>
    </div>
  );
}

function CvBody({
  cvText,
  highlights,
}: {
  cvText: string;
  highlights?: ReadonlyArray<CvHighlight>;
}) {
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1">
      <CvDocument text={cvText} highlights={highlights} />
    </div>
  );
}

export function CvPanel({
  cvText,
  highlights,
  title = "Your CV",
  description = "Keep it handy while you answer.",
  collapsible = false,
  className,
}: {
  cvText: string;
  highlights?: ReadonlyArray<CvHighlight>;
  title?: string;
  description?: string;
  collapsible?: boolean;
  className?: string;
}) {
  const hasHighlights = Boolean(highlights && highlights.length > 0);

  if (collapsible) {
    return (
      <details className={cn("group bg-card rounded-2xl shadow-sm", className)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-muted-foreground text-xs group-open:hidden">Tap to read</span>
          <span className="text-muted-foreground hidden text-xs group-open:inline">Hide</span>
        </summary>
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {hasHighlights ? (
            <div className="mb-3">
              <HighlightLegend />
            </div>
          ) : null}
          <CvDocument text={cvText} highlights={highlights} />
        </div>
      </details>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Read the full CV">
                <Maximize2 aria-hidden />
                Read
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Your CV</DialogTitle>
                <DialogDescription>The text Gemini extracted from your PDF.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                {hasHighlights ? (
                  <div className="mb-3">
                    <HighlightLegend />
                  </div>
                ) : null}
                <CvDocument text={cvText} highlights={highlights} />
              </div>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasHighlights ? <HighlightLegend /> : null}
        <CvBody cvText={cvText} highlights={highlights} />
      </CardContent>
    </Card>
  );
}
