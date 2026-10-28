import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ai-interview/ui/card";
import { cn } from "@ai-interview/ui/utils";

function CvBody({ cvText }: { cvText: string }) {
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 text-sm leading-relaxed whitespace-pre-wrap">
      {cvText}
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
        <div className="px-6 pb-6">
          <CvBody cvText={cvText} />
        </div>
      </details>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Your CV</CardTitle>
        <CardDescription>Keep it handy while you answer.</CardDescription>
      </CardHeader>
      <CardContent>
        <CvBody cvText={cvText} />
      </CardContent>
    </Card>
  );
}
