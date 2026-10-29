import path from "node:path";

import server from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";
const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const clientDir = path.resolve(import.meta.dir, "dist/client");

/** Serves a built client asset when it exists and stays inside `dist/client`. */
async function serveStatic(pathname) {
  if (pathname === "/") return null;

  const resolved = path.resolve(clientDir, `.${pathname}`);
  if (!resolved.startsWith(`${clientDir}${path.sep}`)) return null;

  const file = Bun.file(resolved);
  if (!(await file.exists())) return null;

  return new Response(file, { headers: { "content-type": file.type } });
}

Bun.serve({
  port,
  hostname,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return fetch(new Request(new URL(url.pathname + url.search, apiUrl), request));
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const asset = await serveStatic(url.pathname);
      if (asset) return asset;
    }

    return server.fetch(request);
  },
});

console.log(`web listening on http://${hostname}:${port}`);
