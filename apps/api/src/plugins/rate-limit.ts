import { Elysia } from "elysia";

import { RateLimitedError } from "@/libs/api-error";

interface Rule {
  readonly max: number;
  readonly windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Requests per window for every route. */
  readonly general?: Rule;
  /** Requests per window for routes that spend a Gemini call. */
  readonly expensive?: Rule;
  readonly now?: () => number;
}

/** Routes that bill a Gemini request, so they get the tighter bucket. */
const EXPENSIVE_ROUTES: ReadonlyArray<{ method: string; pattern: RegExp }> = [
  { method: "POST", pattern: /^\/api\/cv\/extract$/ },
  { method: "POST", pattern: /^\/api\/cv-reviews$/ },
  { method: "POST", pattern: /^\/api\/interviews\/[^/]+\/generate-plan$/ },
  { method: "POST", pattern: /^\/api\/practice$/ },
  {
    method: "POST",
    pattern: /^\/api\/sessions\/[^/]+\/(start|answer|end|evaluate|realtime-token)$/,
  },
];

/** Dropped buckets are cheap to recreate, so the map never grows without bound. */
const MAX_TRACKED_CLIENTS = 1_000;

function isExpensive(method: string, path: string): boolean {
  return EXPENSIVE_ROUTES.some((route) => route.method === method && route.pattern.test(path));
}

/**
 * Per-client request limiter. It keeps two buckets per client: one for every
 * route and one for the routes that call Gemini, so a single client cannot run
 * up the API key's quota.
 */
export function createRateLimit(options: RateLimitOptions = {}) {
  const general = options.general ?? { max: 600, windowMs: 60_000 };
  const expensive = options.expensive ?? { max: 20, windowMs: 60_000 };
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  const take = (key: string, rule: Rule): boolean => {
    const time = now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= time) {
      if (buckets.size >= MAX_TRACKED_CLIENTS) {
        for (const [tracked, entry] of buckets) {
          if (entry.resetAt <= time) buckets.delete(tracked);
        }
      }

      buckets.set(key, { count: 1, resetAt: time + rule.windowMs });
      return true;
    }

    if (bucket.count >= rule.max) return false;
    bucket.count += 1;
    return true;
  };

  return new Elysia({ name: "rate-limit" }).onBeforeHandle("global", ({ request, server, set }) => {
    const path = new URL(request.url).pathname;
    const client = server?.requestIP(request)?.address ?? "local";
    const rule = isExpensive(request.method, path) ? expensive : general;
    const key = `${client}:${rule === expensive ? "expensive" : "general"}`;

    if (!take(key, rule)) {
      set.headers["retry-after"] = String(Math.ceil(rule.windowMs / 1000));
      throw new RateLimitedError();
    }
  });
}

export const rateLimit = createRateLimit();
