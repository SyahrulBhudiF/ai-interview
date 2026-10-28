import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { RateLimitExceededError } from "@/libs/api-error";

interface Rule {
  readonly max: number;
  readonly windowMs: number;
}

interface RateLimitOptions {
  /** Requests per window for every route. */
  readonly general?: Rule;
  /** Requests per window for routes that spend a Gemini call. */
  readonly expensive?: Rule;
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

function isExpensiveRequest(request: Request): boolean {
  const path = new URL(request.url).pathname;

  return EXPENSIVE_ROUTES.some(
    (route) => route.method === request.method && route.pattern.test(path),
  );
}

/**
 * Per-client rate limiting, on `elysia-rate-limit` for the counting, the
 * `RateLimit-*` headers, and the LRU store.
 *
 * Two buckets share the plugin: one for every route and one for the routes that
 * call Gemini, so a single client cannot run up the API key's quota. Each bucket
 * skips the requests that belong to the other one.
 */
export function createRateLimit(options: RateLimitOptions = {}) {
  const general = options.general ?? { max: 600, windowMs: 60_000 };
  const expensive = options.expensive ?? { max: 20, windowMs: 60_000 };

  const bucket = (rule: Rule, skip: (request: Request) => boolean) =>
    rateLimit({
      scoping: "global",
      max: rule.max,
      duration: rule.windowMs,
      generator: (request, server) => server?.requestIP(request)?.address ?? "local",
      skip,
      // A failed Gemini call still costs quota, so failures count too.
      countFailedRequest: true,
      // Thrown into the global onError, which returns the usual error envelope.
      errorResponse: new RateLimitExceededError(rule.windowMs / 1000),
    });

  return new Elysia({ name: "rate-limit" })
    .use(bucket(general, isExpensiveRequest))
    .use(bucket(expensive, (request) => !isExpensiveRequest(request)));
}

export const rateLimitPlugin = createRateLimit();
