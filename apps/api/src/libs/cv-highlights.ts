import { CV_HIGHLIGHT_LIMITS, type CvHighlight } from "@ai-interview/shared";

/**
 * Gemini only promises 3-6 verbatim quotes. Enforce it here so a chatty model
 * cannot turn the CV into a wall of color, and drop repeats and bare tokens.
 */
export function normalizeCvHighlights(highlights: ReadonlyArray<CvHighlight>): CvHighlight[] {
  const seen = new Set<string>();
  const result: CvHighlight[] = [];

  for (const highlight of highlights) {
    const quote = highlight.quote.trim();
    const key = quote.toLowerCase().replace(/\s+/g, " ");

    if (quote.length < CV_HIGHLIGHT_LIMITS.minQuoteLength || seen.has(key)) continue;

    seen.add(key);
    result.push({ ...highlight, quote });

    if (result.length === CV_HIGHLIGHT_LIMITS.maxHighlights) break;
  }

  return result;
}
