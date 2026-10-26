import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://ai_interview:ai_interview@127.0.0.1:5432/ai_interview",
  },
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  strict: true,
  verbose: true,
});
