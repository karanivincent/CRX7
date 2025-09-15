import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
