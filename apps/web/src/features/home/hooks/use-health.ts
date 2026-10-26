import { ApiSuccessSchema, HealthResponseSchema } from "@ai-interview/shared";
import { useQuery } from "@tanstack/react-query";
import { Schema } from "effect";

import { api } from "@/lib/eden";

export function useHealth() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error || !data) throw new Error("health check failed");
      return Schema.decodeUnknownSync(ApiSuccessSchema(HealthResponseSchema))(data).data;
    },
    enabled: !import.meta.env.SSR,
  });

  const status = health.isPending
    ? "Loading…"
    : health.isError || !health.data
      ? "Unreachable (is the API running?)"
      : `${health.data.name} — ${health.data.status} (${health.data.uptime.toFixed(0)}s up)`;

  return { status, isPending: health.isPending };
}
