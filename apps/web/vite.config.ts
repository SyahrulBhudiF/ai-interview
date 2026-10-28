import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // The API port comes from the repo-root `.env` (`API_PORT`), the same value
  // apps/api reads.
  const env = loadEnv(mode, path.resolve(import.meta.dirname, "../.."), "");
  const apiOrigin = env.VITE_API_URL ?? `http://localhost:${env.API_PORT ?? "3001"}`;

  return {
    resolve: { tsconfigPaths: true },
    server: {
      port: 3000,
      proxy: {
        "/api": apiOrigin,
      },
    },
    plugins: [tailwindcss(), tanstackStart(), viteReact()],
  };
});
