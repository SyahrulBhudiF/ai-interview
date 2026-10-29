import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";

import { ok } from "@/libs/response";
import { loggerPlugin } from "@/plugins/logger";
import { createRateLimit } from "@/plugins/rate-limit";

function buildApp(options: Parameters<typeof createRateLimit>[0]) {
  return new Elysia()
    .use(loggerPlugin)
    .use(createRateLimit(options))
    .get("/ping", () => ok({ pong: true }))
    .post("/api/cv/extract", () => ok({ cvText: "extracted" }))
    .post("/api/cv-reviews", () => ok({ report: "reviewed" }))
    .post("/api/interviews/:id/generate-plan", () => ok({ stages: [] }))
    .post("/api/practice", () => ok({ interviewId: "interview-1" }))
    .post("/api/sessions/:id/start", () => ok({ started: true }))
    .post("/api/sessions/:id/answer", () => ok({ followUp: null }))
    .post("/api/sessions/:id/end", () => ok({ ended: true }))
    .post("/api/sessions/:id/evaluate", () => ok({ report: "evaluated" }))
    .post("/api/sessions/:id/realtime-token", () => ok({ token: "token" }));
}

function hit(app: ReturnType<typeof buildApp>, path: string, method = "GET") {
  return app.handle(new Request(`http://localhost${path}`, { method }));
}

describe("rate limit", () => {
  it("rejects requests over the general limit with the error envelope", async () => {
    const app = buildApp({ general: { max: 2, windowMs: 60_000 } });

    expect((await hit(app, "/ping")).status).toBe(200);
    expect((await hit(app, "/ping")).status).toBe(200);

    const limited = await hit(app, "/ping");
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many requests" },
    });
    expect(limited.headers.get("retry-after")).toBe("60");
  });

  it("reports the window of the bucket that rejected the request", async () => {
    const app = buildApp({ general: { max: 1, windowMs: 30_000 } });

    expect((await hit(app, "/ping")).status).toBe(200);

    const limited = await hit(app, "/ping");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("30");
  });

  it("counts expensive routes in their own bucket", async () => {
    const app = buildApp({
      general: { max: 10, windowMs: 60_000 },
      expensive: { max: 1, windowMs: 60_000 },
    });

    expect((await hit(app, "/api/cv/extract", "POST")).status).toBe(200);
    expect((await hit(app, "/api/cv/extract", "POST")).status).toBe(429);
    // The general bucket is untouched, so plain reads still work.
    expect((await hit(app, "/ping")).status).toBe(200);
  });

  it("applies the expensive bucket to every Gemini route", async () => {
    const paths = [
      "/api/cv/extract",
      "/api/cv-reviews",
      "/api/interviews/interview-1/generate-plan",
      "/api/practice",
      "/api/sessions/session-1/answer",
      "/api/sessions/session-1/evaluate",
      "/api/sessions/session-1/realtime-token",
    ];

    const results = await Promise.all(
      paths.map(async (path) => {
        const app = buildApp({
          general: { max: 10, windowMs: 60_000 },
          expensive: { max: 1, windowMs: 60_000 },
        });

        return {
          path,
          first: (await hit(app, path, "POST")).status,
          second: (await hit(app, path, "POST")).status,
        };
      }),
    );

    for (const { path, first, second } of results) {
      expect(first, path).toBe(200);
      expect(second, path).toBe(429);
    }
  });

  it("leaves session start and end in the general bucket", async () => {
    const app = buildApp({
      general: { max: 10, windowMs: 60_000 },
      expensive: { max: 1, windowMs: 60_000 },
    });

    expect((await hit(app, "/api/sessions/session-1/start", "POST")).status).toBe(200);
    expect((await hit(app, "/api/sessions/session-1/end", "POST")).status).toBe(200);
    expect((await hit(app, "/api/sessions/session-1/start", "POST")).status).toBe(200);

    // The expensive bucket is still empty, so the first Gemini call is allowed.
    expect((await hit(app, "/api/sessions/session-1/answer", "POST")).status).toBe(200);
    expect((await hit(app, "/api/sessions/session-1/answer", "POST")).status).toBe(429);
  });
});
