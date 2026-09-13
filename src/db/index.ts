import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

export type AppDb =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>;

declare global {
  var _cachedDb: AppDb | undefined;
  var _pgPool: Pool | undefined;
}

export function getDb(): AppDb {
  if (global._cachedDb) {
    return global._cachedDb;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "CRITICAL: DATABASE_URL environment variable is missing. A PostgreSQL connection is required."
    );
  }

  const isNeon = databaseUrl.includes("neon.tech") || process.env.VERCEL === "1";

  if (isNeon) {
    const sql = neon(databaseUrl);
    const db = drizzleNeon(sql, { schema });
    if (process.env.NODE_ENV !== "production") {
      global._cachedDb = db;
    }
    return db;
  }

  // Local / standard PostgreSQL (e.g. Docker Compose)
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: databaseUrl,
    });
  }

  const db = drizzlePg(global._pgPool, { schema });
  global._cachedDb = db;
  return db;
}

export const isProduction = process.env.NODE_ENV === "production";
export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
