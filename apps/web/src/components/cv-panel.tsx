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

function CvBody({ cvText }: { cvText: string }) {
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1">
      <CvDocument text={cvText} />
    </div>
  );
}

export function CvPanel({
  cvText,
  collapsible = false,
  className,
}: {
  cvText: string;
  collapsible?: boolean;
  className?: string;
}) {
  if (collapsible) {
    return (
      <details className={cn("group bg-card rounded-2xl shadow-sm", className)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
          <span className="text-sm font-medium">Your CV</span>
          <span className="text-muted-foreground text-xs group-open:hidden">Tap to read</span>
          <span className="text-muted-foreground hidden text-xs group-open:inline">Hide</span>
        </summary>
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <CvDocument text={cvText} />
        </div>
      </details>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your CV</CardTitle>
        <CardDescription>Keep it handy while you answer.</CardDescription>
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
                <CvDocument text={cvText} />
              </div>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CvBody cvText={cvText} />
      </CardContent>
    </Card>
  );
}
