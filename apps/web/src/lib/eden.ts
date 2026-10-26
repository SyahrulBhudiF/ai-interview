import { treaty } from "@elysia/eden";
import type { App } from "api";

// Client calls are same-origin through the Vite proxy (`/api` -> :3001);
// server-side calls (if any) go straight to the API.
const apiUrl =
  import.meta.env.VITE_API_URL ??
  (typeof window === "undefined" ? "http://localhost:3001" : window.location.origin);

export const api = treaty<App>(apiUrl, { parseDate: false });
