"use server";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { Reward, RewardCategory } from "@/types";

export async function getRewards({
  activeOnly = false,
}: {
  activeOnly?: boolean;
} = {}): Promise<Reward[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.rewards)
    .orderBy(asc(schema.rewards.sortOrder));

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
  await db.insert(schema.rewards).values({
    id,
    title: data.title.trim(),
    description: data.description.trim(),
    points: data.points,
    emoji: data.emoji || "gift",
    category: data.category || "Little Things",
    featured: Boolean(data.featured),
    active: data.active !== false,
    fulfillmentInstructions: data.fulfillmentInstructions || null,
    sortOrder: 99,
    createdAt: now,
    updatedAt: now,
  });

  safeRevalidate();

  return { success: true, rewardId: id };
}

function safeRevalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/admin");
  } catch {}
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

  safeRevalidate();

  return { success: true };
}

export async function toggleRewardActiveAction(id: string, active: boolean) {
  await requireRole("admin");
  return updateRewardAction(id, { active });
}
