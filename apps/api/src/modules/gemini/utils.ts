/**
 * Wraps candidate-supplied text in a labelled block and neutralises anything
 * that tries to close the block early and escape into the instructions.
 */
export function wrapCandidateData(label: string, text: string): string {
  const safe = text.replaceAll("</candidate_data>", "[/candidate_data]");
  return `<candidate_data source="${label}">\n${safe}\n</candidate_data>`;
}

/** Collapses user text used inline in a prompt to one line without tag syntax. */
export function inlineLabel(text: string): string {
  return text
    .replace(/[\r\n]+/g, " ")
    .replaceAll("<", "‹")
    .replaceAll(">", "›")
    .trim();
}
