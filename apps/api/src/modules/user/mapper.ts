import type { User } from "@repo/shared";

import type { User as DbUser } from "../../database/schema";

/** Maps a database row ($inferSelect) to the shared wire type. */
export function toUser(row: DbUser): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}
