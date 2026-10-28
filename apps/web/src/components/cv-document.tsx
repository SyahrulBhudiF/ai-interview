import type { CvHighlight } from "@ai-interview/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ai-interview/ui/tooltip";
import { cn } from "@ai-interview/ui/utils";
import { useState, type ReactNode } from "react";

type Block =
  | { kind: "name"; text: string }
  | { kind: "contact"; text: string }
  | { kind: "section"; text: string }
  | { kind: "entry"; left: string; right: string }
  | { kind: "bullet"; text: string }
  | { kind: "tech"; text: string }
  | { kind: "text"; text: string };

const SECTIONS = new Set([
  "summary",
  "profile",
  "about",
  "professional summary",
  "work experience",
  "experience",
  "professional experience",
  "employment",
  "projects",
  "personal projects",
  "selected projects",
  "education",
  "organization experience",
  "organisational experience",
  "organizational experience",
  "organizations",
  "organisations",
  "skills",
  "technical skills",
  "core skills",
  "certifications",
  "awards",
  "honors",
  "languages",
  "publications",
  "volunteer",
  "volunteering",
  "interests",
  "activities",
]);

const DATE_POINT = "(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+)?\\d{4}";
const DATE_SPAN = `${DATE_POINT}\\s*[–—-]\\s*(?:present|${DATE_POINT})`;
const DATE_ONLY = new RegExp(`^(${DATE_SPAN})$`, "i");
const DATE_RANGE = new RegExp(`\\s+(${DATE_SPAN})\\s*$`, "i");

const BULLET = /^\s*[•●▪◦·*\-–—]\s*/;

const TECH = /^(tech\s*stack|stack|technologies)\s*[:\-–]\s*(.+)$/i;

const EMPTY_HIGHLIGHTS: ReadonlyArray<CvHighlight> = [];

function isSection(line: string): boolean {
  return SECTIONS.has(
    line
      .toLowerCase()
      .replace(/[:\s]+$/, "")
      .trim(),
  );
}

export function parseCv(text: string): Block[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const blocks: Block[] = [];
  let index = 0;

  for (const raw of lines) {
    const line = raw.trim();

    if (blocks.length === 0 && !line.includes("|")) {
      blocks.push({ kind: "name", text: line });
      index += 1;
      continue;
    }

    if (index <= 2 && (line.includes("|") || line.includes("@"))) {
      blocks.push({ kind: "contact", text: line });
      index += 1;
      continue;
    }

    if (isSection(line)) {
      blocks.push({ kind: "section", text: line.replace(/:\s*$/, "") });
      index += 1;
      continue;
    }

    if (TECH.test(line)) {
      blocks.push({ kind: "tech", text: line });
      index += 1;
      continue;
    }

    if (BULLET.test(raw)) {
      blocks.push({ kind: "bullet", text: line.replace(BULLET, "") });
      index += 1;
      continue;
    }

    const dateOnly = line.match(DATE_ONLY);
    if (dateOnly) {
      const previous = blocks[blocks.length - 1];

      if (previous?.kind === "text") {
        blocks[blocks.length - 1] = {
          kind: "entry",
          left: previous.text,
          right: dateOnly[1] ?? "",
        };
      } else {
        blocks.push({ kind: "text", text: line });
      }

      index += 1;
      continue;
    }

    const dateMatch = line.match(DATE_RANGE);
    if (dateMatch) {
      const right = dateMatch[1] ?? "";
      const left = line.slice(0, line.length - dateMatch[0].length).trim();

      if (left) {
        blocks.push({ kind: "entry", left, right });
        index += 1;
        continue;
      }
    }

    const previous = blocks[blocks.length - 1];
    const nextLine = lines[index + 1]?.trim();
    const nextIsDate = nextLine ? DATE_ONLY.test(nextLine) : false;

    if (nextIsDate) {
      // The next line is a date range, so this line is an entry header, not a
      // wrapped bullet or paragraph.
      blocks.push({ kind: "text", text: line });
    } else if (previous?.kind === "bullet" || previous?.kind === "text") {
      previous.text = `${previous.text} ${line}`;
    } else {
      blocks.push({ kind: "text", text: line });
    }

    index += 1;
  }

  return blocks;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Folds the punctuation Gemini tends to swap (smart quotes, en/em dashes) into
 * its ASCII form. Every replacement is one character for one character, so the
 * match indices still point at the original text.
 */
const MATCH_FOLD: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u00a0": " ",
};

function foldForMatch(value: string): string {
  return value.replace(
    /[\u2018\u2019\u201c\u201d\u2013\u2014\u00a0]/g,
    (char) => MATCH_FOLD[char] ?? char,
  );
}

/** Finds the quote in the text, tolerating case, whitespace, and punctuation differences. */
function findRange(text: string, quote: string): { start: number; end: number } | null {
  const trimmed = quote.trim();
  if (!trimmed) return null;

  const pattern = new RegExp(
    foldForMatch(trimmed).split(/\s+/).map(escapeRegExp).join("\\s+"),
    "i",
  );

  const match = pattern.exec(foldForMatch(text));

  return match ? { start: match.index, end: match.index + match[0].length } : null;
}

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- a highlight is an inline tooltip trigger; a button cannot stay inline */
function HighlightMark({ highlight, text }: { highlight: CvHighlight; text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <mark
          tabIndex={0}
          onClick={(event) => {
            // Radix closes a tooltip on click; keep it open so tapping works on touch.
            event.preventDefault();
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setOpen(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setOpen(false);
          }}
          className={cn(
            "focus-visible:ring-ring/50 cursor-help rounded-[3px] px-0.5 text-inherit outline-none focus-visible:ring-[3px] [box-decoration-break:clone]",
            highlight.kind === "strong" ? "bg-success/30" : "bg-warning/35",
          )}
        >
          {text}
        </mark>
      </TooltipTrigger>
      <TooltipContent>{highlight.reason}</TooltipContent>
    </Tooltip>
  );
}

function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: ReadonlyArray<CvHighlight>;
}) {
  if (highlights.length === 0) return <>{text}</>;

  const ranges = highlights
    .map((highlight) => {
      const range = findRange(text, highlight.quote);
      return range ? { ...range, highlight } : null;
    })
    .filter(
      (range): range is { start: number; end: number; highlight: CvHighlight } => range !== null,
    )
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return <>{text}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const [index, range] of ranges.entries()) {
    if (range.start < cursor) continue;
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));

    parts.push(
      <HighlightMark
        key={`${range.start}-${index}`}
        highlight={range.highlight}
        text={text.slice(range.start, range.end)}
      />,
    );

    cursor = range.end;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */

function BlockView({
  block,
  highlights,
}: {
  block: Block;
  highlights: ReadonlyArray<CvHighlight>;
}) {
  switch (block.kind) {
    case "name":
      return (
        <p className="font-serif text-xl leading-tight tracking-tight">
          <HighlightedText text={block.text} highlights={highlights} />
        </p>
      );
    case "contact":
      return (
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          <HighlightedText text={block.text} highlights={highlights} />
        </p>
      );
    case "section":
      return (
        <p className="text-primary border-border/70 mt-5 border-b pb-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
          {block.text}
        </p>
      );
    case "entry":
      return (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-[13px] leading-snug font-medium">
            <HighlightedText text={block.left} highlights={highlights} />
          </p>
          <p className="text-muted-foreground shrink-0 text-[11px] whitespace-nowrap tabular-nums">
            {block.right}
          </p>
        </div>
      );
    case "bullet":
      return (
        <div className="flex gap-2 text-[13px] leading-relaxed">
          <span aria-hidden className="bg-primary mt-[0.5em] size-1 shrink-0 rounded-full" />
          <p className="flex-1">
            <HighlightedText text={block.text} highlights={highlights} />
          </p>
        </div>
      );
    case "tech":
      return (
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          <HighlightedText text={block.text} highlights={highlights} />
        </p>
      );
    case "text":
      return (
        <p className="text-[13px] leading-relaxed">
          <HighlightedText text={block.text} highlights={highlights} />
        </p>
      );
  }
}

/** The pieces BlockView sends through HighlightedText. */
function blockText(block: Block): string | null {
  switch (block.kind) {
    case "entry":
      return block.left;
    case "section":
      return null;
    default:
      return block.text;
  }
}

function UnplacedHighlights({ highlights }: { highlights: ReadonlyArray<CvHighlight> }) {
  if (highlights.length === 0) return null;

  return (
    <div className="border-border/70 mt-4 rounded-xl border border-dashed px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
        Couldn't place on the CV
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {highlights.map((highlight) => (
          <li key={`${highlight.quote}-${highlight.reason}`} className="text-xs leading-relaxed">
            <span
              aria-hidden
              className={cn(
                "mr-1.5 inline-block size-1.5 rounded-full align-middle",
                highlight.kind === "strong" ? "bg-success" : "bg-warning",
              )}
            />
            <span className="font-medium">“{highlight.quote}”</span>{" "}
            <span className="text-muted-foreground">{highlight.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CvDocument({
  text,
  highlights = EMPTY_HIGHLIGHTS,
  className,
}: {
  text: string;
  highlights?: ReadonlyArray<CvHighlight>;
  className?: string;
}) {
  const blocks = parseCv(text);
  const blockTexts = blocks.map(blockText).filter((value): value is string => value !== null);

  const placed = highlights.filter((highlight) =>
    blockTexts.some((block) => findRange(block, highlight.quote) !== null),
  );

  const unplaced = highlights.filter((highlight) => !placed.includes(highlight));

  return (
    <div className={cn("space-y-1.5", className)}>
      {blocks.map((block, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- parsed CV blocks have no ids
        <BlockView key={index} block={block} highlights={placed} />
      ))}
      <UnplacedHighlights highlights={unplaced} />
    </div>
  );
}
