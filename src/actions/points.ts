"use server";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql, and, gte, gt } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { PointTransaction } from "@/types";

export async function getPointsBalance(userId: string = "user_girlfriend"): Promise<number> {
  const db = getDb();
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${schema.pointTransactions.amount}), 0)`,
    })
    .from(schema.pointTransactions)
    .where(eq(schema.pointTransactions.userId, userId));

  return Number(result[0]?.total ?? 0);
}

export async function getPointsHistory(
  userId: string = "user_girlfriend"
): Promise<PointTransaction[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.pointTransactions)
    .where(eq(schema.pointTransactions.userId, userId))
    .orderBy(desc(schema.pointTransactions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    type: r.type as any,
    reason: r.reason,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getTodayPointsEarned(
  userId: string = "user_girlfriend"
): Promise<number> {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${schema.pointTransactions.amount}), 0)`,
    })
    .from(schema.pointTransactions)
    .where(
      and(
        eq(schema.pointTransactions.userId, userId),
        gt(schema.pointTransactions.amount, 0),
        gte(schema.pointTransactions.createdAt, startOfDay)
      )
    );

  return Number(result[0]?.total ?? 0);
}

export async function getRecentEarnedTransactions(
  userId: string = "user_girlfriend",
  limit: number = 3
): Promise<PointTransaction[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.pointTransactions)
    .where(
      and(
        eq(schema.pointTransactions.userId, userId),
        gt(schema.pointTransactions.amount, 0)
      )
    )
    .orderBy(desc(schema.pointTransactions.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    type: r.type as any,
    reason: r.reason,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function givePointsAction({
  amount,
  reason,
  type = "earned",
  userId = "user_girlfriend",
}: {
  amount: number;
  reason: string;
  type?: "earned" | "bonus" | "adjustment";
  userId?: string;
}) {
  await requireRole("admin");

  if (!amount || amount <= 0) {
    return { success: false, error: "Points amount must be greater than zero." };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: "A reason must be provided." };
  }

  const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const db = getDb();
  await db.insert(schema.pointTransactions).values({
    id,
    userId,
    amount,
    type,
    reason: reason.trim(),
    createdAt: now,
  });

  const newBalance = await getPointsBalance(userId);
  return { success: true, balance: newBalance };
}

export async function deductPointsAction({
  amount,
  reason,
  userId = "user_girlfriend",
}: {
  amount: number;
  reason: string;
  userId?: string;
}) {
  await requireRole("admin");

  if (!amount || amount <= 0) {
    return { success: false, error: "Points amount must be greater than zero." };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: "A reason must be provided." };
  }

  const currentBalance = await getPointsBalance(userId);
  if (currentBalance < amount) {
    return {
      success: false,
      error: `Cannot deduct ${amount} points. Current balance is only ${currentBalance}.`,
    };
  }

  const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const db = getDb();
  await db.insert(schema.pointTransactions).values({
    id,
    userId,
    amount: -amount,
    type: "adjustment",
    reason: reason.trim(),
    createdAt: now,
  });

  const newBalance = await getPointsBalance(userId);
  return { success: true, balance: newBalance };
}
