/** Extracts the API envelope's `error.message` from an Eden fetch error, with a fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const value = (error as { value?: unknown } | undefined)?.value;
  if (value && typeof value === "object") {
    const message = (value as { error?: { message?: unknown } }).error?.message;
    if (typeof message === "string") return message;
  }
  return fallback;
}
