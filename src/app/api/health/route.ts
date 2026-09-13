import { NextResponse } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || "";
  
  // Safe environment inspection (do not expose password)
  let safeDbHost = "not-configured";
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl.replace(/^postgres(ql)?:\/\//, "http://"));
      safeDbHost = `${url.username ? "***@" : ""}${url.host}${url.pathname}`;
    } catch {
      safeDbHost = "configured (custom format)";
    }
  }

  const env = {
    hasDatabaseUrl: Boolean(databaseUrl),
    databaseHost: safeDbHost,
    isNeonTech: databaseUrl.includes("neon.tech"),
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasGirlfriendPassword: Boolean(process.env.GIRLFRIEND_PASSWORD),
    nodeEnv: process.env.NODE_ENV,
    isVercel: process.env.VERCEL === "1",
  };

  if (!databaseUrl) {
    return NextResponse.json(
      {
        status: "error",
        code: "MISSING_DATABASE_URL",
        message:
          "DATABASE_URL environment variable is missing. Please add DATABASE_URL in your Vercel Project Settings > Environment Variables.",
        env,
      },
      { status: 503 }
    );
  }

  try {
    const db = getDb();
    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.rewards);
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      rewardsCount: Number(result[0]?.count || 0),
      env,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        code: "DATABASE_QUERY_FAILED",
        message: error?.message || String(error),
        env,
      },
      { status: 500 }
    );
  }
}
