"use server";

import { getDb, readLocalDb, writeLocalDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { Reward, RewardCategory } from "@/types";

export async function getRewards({
  activeOnly = false,
}: {
  activeOnly?: boolean;
} = {}): Promise<Reward[]> {
  const db = getDb();
  if (db) {
    let query = db.select().from(schema.rewards).orderBy(asc(schema.rewards.sortOrder));
    const rows = await query;
    const filtered = activeOnly ? rows.filter((r) => r.active) : rows;

    return filtered.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      points: r.points,
      emoji: r.emoji,
      category: r.category as RewardCategory,
      featured: r.featured,
      active: r.active,
      fulfillmentInstructions: r.fulfillmentInstructions,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  const local = readLocalDb();
  let list = [...local.rewards].sort((a, b) => a.sortOrder - b.sortOrder);
  if (activeOnly) {
    list = list.filter((r) => r.active);
  }

  return list.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    points: r.points,
    emoji: r.emoji,
    category: r.category as RewardCategory,
    featured: r.featured,
    active: r.active,
    fulfillmentInstructions: r.fulfillmentInstructions,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createRewardAction(data: {
  title: string;
  description: string;
  points: number;
  emoji: string;
  category: RewardCategory;
  featured?: boolean;
  active?: boolean;
  fulfillmentInstructions?: string;
}) {
  await requireRole("admin");

  if (!data.title?.trim()) return { success: false, error: "Title is required" };
  if (!data.points || data.points <= 0) return { success: false, error: "Points must be greater than 0" };

  const id = `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();

  const db = getDb();
  if (db) {
    await db.insert(schema.rewards).values({
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      points: data.points,
      emoji: data.emoji || "🎁",
      category: data.category || "Little Things",
      featured: Boolean(data.featured),
      active: data.active !== false,
      fulfillmentInstructions: data.fulfillmentInstructions || null,
      sortOrder: 99,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const local = readLocalDb();
    local.rewards.push({
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      points: data.points,
      emoji: data.emoji || "🎁",
      category: data.category || "Little Things",
      featured: Boolean(data.featured),
      active: data.active !== false,
      fulfillmentInstructions: data.fulfillmentInstructions || null,
      sortOrder: 99,
      createdAt: now,
      updatedAt: now,
    });
    writeLocalDb(local);
  }

  return { success: true, rewardId: id };
}

export async function updateRewardAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    points?: number;
    emoji?: string;
    category?: RewardCategory;
    featured?: boolean;
    active?: boolean;
    fulfillmentInstructions?: string;
  }
) {
  await requireRole("admin");

  const now = new Date();
  const db = getDb();
  if (db) {
    await db
      .update(schema.rewards)
      .set({
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description.trim() } : {}),
        ...(data.points !== undefined ? { points: data.points } : {}),
        ...(data.emoji !== undefined ? { emoji: data.emoji } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.fulfillmentInstructions !== undefined
          ? { fulfillmentInstructions: data.fulfillmentInstructions }
          : {}),
        updatedAt: now,
      })
      .where(eq(schema.rewards.id, id));
  } else {
    const local = readLocalDb();
    const idx = local.rewards.findIndex((r) => r.id === id);
    if (idx !== -1) {
      local.rewards[idx] = {
        ...local.rewards[idx],
        ...data,
        updatedAt: now,
      };
      writeLocalDb(local);
    }
  }

  return { success: true };
}

export async function toggleRewardActiveAction(id: string, active: boolean) {
  await requireRole("admin");
  return updateRewardAction(id, { active });
}
