import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { DATABASE_URL } from "$env/static/private";

// Configure PostgreSQL client for Supabase pooler
const client = postgres(DATABASE_URL, {
  ssl: 'require',
  connection: {
    TimeZone: 'UTC',
  },
  max: 1, // Single connection to work with pooler
  idle_timeout: 60, // Keep connections alive longer for pooler
  connect_timeout: 30, // Longer timeout for pooler connections
  prepare: false, // Disable prepared statements for pooler compatibility
});

export const db = drizzle(client, { schema });
