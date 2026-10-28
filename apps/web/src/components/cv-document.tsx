import { cn } from "@ai-interview/ui/utils";

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

const DATE_RANGE =
  /\s+((?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*[–—-]\s*(?:present|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}))\s*$/i;

const BULLET = /^\s*[•●▪◦·*\-–—]\s*/;

const TECH = /^(tech\s*stack|stack|technologies)\s*[:\-–]\s*(.+)$/i;

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

    if (previous?.kind === "bullet" || previous?.kind === "text") {
      previous.text = `${previous.text} ${line}`;
    } else {
      blocks.push({ kind: "text", text: line });
    }

    index += 1;
  }

  return blocks;
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "name":
      return <p className="font-serif text-xl leading-tight tracking-tight">{block.text}</p>;
    case "contact":
      return <p className="text-muted-foreground text-[11px] leading-relaxed">{block.text}</p>;
    case "section":
      return (
        <p className="text-primary border-border/70 mt-5 border-b pb-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
          {block.text}
        </p>
      );
    case "entry":
      return (
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-[13px] leading-snug font-medium">{block.left}</p>
          <p className="text-muted-foreground shrink-0 text-[11px] whitespace-nowrap tabular-nums">
            {block.right}
          </p>
        </div>
      );
    case "bullet":
      return (
        <div className="flex gap-2 text-[13px] leading-relaxed">
          <span aria-hidden className="bg-primary mt-[0.5em] size-1 shrink-0 rounded-full" />
          <p className="flex-1">{block.text}</p>
        </div>
      );
    case "tech":
      return <p className="text-muted-foreground text-[11px] leading-relaxed">{block.text}</p>;
    case "text":
      return <p className="text-[13px] leading-relaxed">{block.text}</p>;
  }
}

export function CvDocument({ text, className }: { text: string; className?: string }) {
  const blocks = parseCv(text);

  return (
    <div className={cn("space-y-1.5", className)}>
      {blocks.map((block, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- parsed CV blocks have no ids
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}
