import { Button } from "@ai-interview/ui/button";
import { Label } from "@ai-interview/ui/label";
import { Textarea } from "@ai-interview/ui/textarea";
import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { useCvExtraction } from "@/hooks/use-cv-extraction";

export function CvInput({
  value,
  model,
  required = false,
  onChange,
}: {
  value?: string;
  model?: string;
  required?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const extract = useCvExtraction();

  const read = (file: File | undefined) => {
    if (!file) return;

    setFileName(file.name);
    extract.mutate(
      { file, model },
      {
        onSuccess: (result) => onChange(result.cvText),
        // Clearing the input earlier can invalidate the File while it is still
        // being read, so reset it once the request settles.
        onSettled: () => {
          if (inputRef.current) inputRef.current.value = "";
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor="cv-upload">CV{required ? "" : " (optional)"}</Label>
          <p className="text-muted-foreground text-xs">
            PDF, up to 10MB. Gemini reads it and keeps the text editable below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id="cv-upload"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              read(event.target.files?.[0]);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={extract.isPending}
          >
            <Upload aria-hidden />
            {extract.isPending ? "Reading…" : value ? "Replace PDF" : "Upload PDF"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setFileName(null);
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {fileName ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <FileText aria-hidden className="size-3.5" />
          {fileName}
        </p>
      ) : null}

      {value ? (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">
            Extracted text. Edit it if anything came through wrong.
          </p>
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label="CV text"
            className="min-h-40 text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}
