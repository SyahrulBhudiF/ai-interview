/** Reads the first validation message TanStack Form puts on a field. */
export function firstErrorMessage(errors: readonly unknown[]): string | undefined {
  const first = errors[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "message" in first) {
    const message = (first as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
}
