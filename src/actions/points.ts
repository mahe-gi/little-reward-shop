"use server";

import { getDb, readLocalDb, writeLocalDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession, requireRole } from "@/lib/auth";
import { PointTransaction } from "@/types";

export async function getPointsBalance(userId: string = "user_girlfriend"): Promise<number> {
  const db = getDb();
  if (db) {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.pointTransactions.amount}), 0)`,
      })
      .from(schema.pointTransactions)
      .where(eq(schema.pointTransactions.userId, userId));

    return Number(result[0]?.total ?? 0);
  }

  // Local fallback
  const local = readLocalDb();
  const total = local.pointTransactions
    .filter((pt) => pt.userId === userId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return total;
}

export async function getPointsHistory(
  userId: string = "user_girlfriend"
): Promise<PointTransaction[]> {
  const db = getDb();
  if (db) {
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

  const local = readLocalDb();
  return local.pointTransactions
    .filter((pt) => pt.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => ({
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
}: {
  amount: number;
  reason: string;
  type?: "earned" | "bonus" | "adjustment";
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
  if (db) {
    await db.insert(schema.pointTransactions).values({
      id,
      userId: "user_girlfriend",
      amount,
      type,
      reason: reason.trim(),
      createdAt: now,
    });
  } else {
    const local = readLocalDb();
    local.pointTransactions.push({
      id,
      userId: "user_girlfriend",
      amount,
      type,
      reason: reason.trim(),
      orderId: null,
      createdAt: now,
    });
    writeLocalDb(local);
  }

  const newBalance = await getPointsBalance("user_girlfriend");
  return { success: true, balance: newBalance };
}

export async function deductPointsAction({
  amount,
  reason,
}: {
  amount: number;
  reason: string;
}) {
  await requireRole("admin");

  if (!amount || amount <= 0) {
    return { success: false, error: "Points amount must be greater than zero." };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: "A reason must be provided." };
  }

  const currentBalance = await getPointsBalance("user_girlfriend");
  if (currentBalance < amount) {
    return {
      success: false,
      error: `Cannot deduct ${amount} points. Current balance is only ${currentBalance}.`,
    };
  }

  const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const db = getDb();
  if (db) {
    await db.insert(schema.pointTransactions).values({
      id,
      userId: "user_girlfriend",
      amount: -amount,
      type: "adjustment",
      reason: reason.trim(),
      createdAt: now,
    });
  } else {
    const local = readLocalDb();
    local.pointTransactions.push({
      id,
      userId: "user_girlfriend",
      amount: -amount,
      type: "adjustment",
      reason: reason.trim(),
      orderId: null,
      createdAt: now,
    });
    writeLocalDb(local);
  }

  const newBalance = await getPointsBalance("user_girlfriend");
  return { success: true, balance: newBalance };
}
