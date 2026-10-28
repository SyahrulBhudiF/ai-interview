import type { CvHighlight } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";

import { normalizeCvHighlights } from "@/libs/cv-highlights";

const highlight = (quote: string, kind: CvHighlight["kind"] = "strong"): CvHighlight => ({
  quote,
  kind,
  reason: `Why ${quote}`,
});

describe("normalizeCvHighlights", () => {
  it("keeps at most six highlights", () => {
    const highlights = Array.from({ length: 9 }, (_, index) =>
      highlight(`Delivered project number ${index} for the payments team`),
    );

    assert.lengthOf(normalizeCvHighlights(highlights), 6);
  });

  it("drops duplicate quotes regardless of case and spacing", () => {
    const result = normalizeCvHighlights([
      highlight("Led the migration to Kafka"),
      highlight("  led   the MIGRATION to kafka  "),
      highlight("Cut p95 latency by 40 percent"),
    ]);

    assert.deepStrictEqual(
      result.map((item) => item.quote),
      ["Led the migration to Kafka", "Cut p95 latency by 40 percent"],
    );
  });

  it("drops quotes too short to show context", () => {
    const result = normalizeCvHighlights([
      highlight("Go"),
      highlight("PostgreSQL"),
      highlight("Owned the billing pipeline end to end"),
    ]);

    assert.deepStrictEqual(
      result.map((item) => item.quote),
      ["PostgreSQL", "Owned the billing pipeline end to end"],
    );
  });

  it("trims surrounding whitespace from a quote", () => {
    const [first] = normalizeCvHighlights([highlight("  Reduced checkout errors by 30%  ")]);

    assert.strictEqual(first?.quote, "Reduced checkout errors by 30%");
  });
});
