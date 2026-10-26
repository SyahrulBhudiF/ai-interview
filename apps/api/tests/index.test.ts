import { describe, expect, it } from "vitest";

import { app } from "../src/index";

function request(path: string, init?: RequestInit) {
  return app.handle(new Request(`http://localhost${path}`, init));
}

describe("api app", () => {
  it("returns the health success envelope", async () => {
    const response = await request("/api/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { name: "ai-interview-api", status: "ok", uptime: expect.any(Number) },
    });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("greets a valid name", async () => {
    const response = await request("/api/greet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada" }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, data: { message: "Hello, Ada!" } });
  });

  it("returns the error envelope for an invalid body", async () => {
    const response = await request("/api/greet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", message: "Invalid request" },
    });
    expect(body.error.issues).toEqual([{ path: "name", message: expect.any(String) }]);
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });

  it("returns the error envelope for a missing route", async () => {
    const response = await request("/api/missing");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", message: "Not found" },
    });
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });
});
