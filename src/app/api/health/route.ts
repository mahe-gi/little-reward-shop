import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import { ensureDatabaseTables } from "@/db/auto-migrate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const databaseUrl = process.env.DATABASE_URL || "";
  const shouldMigrate = request.nextUrl.searchParams.get("migrate") === "1" || request.nextUrl.searchParams.get("setup") === "1";
  
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

  if (shouldMigrate) {
    try {
      await ensureDatabaseTables();
    } catch (migErr: any) {
      return NextResponse.json(
        {
          status: "error",
          code: "MIGRATION_FAILED",
          message: migErr?.message || String(migErr),
          env,
        },
        { status: 500 }
      );
    }
  }

  try {
    const db = getDb();
    
    // Check cart_items table as well
    try {
      await db.select({ count: sql<number>`count(*)` }).from(schema.cartItems);
    } catch (err: any) {
      if (err?.message?.includes("does not exist") || String(err).includes("relation")) {
        await ensureDatabaseTables();
      }
    }

    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.rewards);
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      tablesReady: true,
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

export async function POST() {
  try {
    await ensureDatabaseTables();
    return NextResponse.json({ status: "ok", message: "Database tables created/verified successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
