import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { DATABASE_URL } from "$env/static/private";

// Configure PostgreSQL client with proper SSL settings for Supabase
const client = postgres(DATABASE_URL, {
  ssl: 'require',
  connection: {
    TimeZone: 'UTC',
  },
  max: 1, // Limit connections to avoid pooling issues
});

export const db = drizzle(client, { schema });
