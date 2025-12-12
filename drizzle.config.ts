import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:admin@localhost:5432/smart_plan";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
