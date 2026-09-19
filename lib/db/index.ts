import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let database: Database | null = null;
let initialized = false;

/**
 * Returns a Drizzle client when DATABASE_URL is configured, otherwise null.
 *
 * The app is designed to run either way: with a database it persists real
 * history, and without one it falls back to the seeded demo dataset so a live
 * demo never depends on a network round trip.
 */
export function getDb(): Database | null {
  if (initialized) return database;
  initialized = true;

  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    client = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 8,
      prepare: false,
      ssl: url.includes("sslmode=require") ? "require" : undefined,
    });
    database = drizzle(client, { schema });
    return database;
  } catch (error) {
    console.warn("[gutguide] database unavailable, using demo data:", error);
    database = null;
    return null;
  }
}

export function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
