"use server";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { CartItem } from "@/types";

export async function getCart(userId?: string): Promise<CartItem[]> {
  const session = await getSession();
  const targetUserId = userId || session?.userId || "user_girlfriend";

  const db = getDb();
  const rows = await db
    .select({
      cartId: schema.cartItems.id,
      rewardId: schema.cartItems.rewardId,
      quantity: schema.cartItems.quantity,
      title: schema.rewards.title,
      description: schema.rewards.description,
      points: schema.rewards.points,
      emoji: schema.rewards.emoji,
      active: schema.rewards.active,
      createdAt: schema.cartItems.createdAt,
    })
    .from(schema.cartItems)
    .innerJoin(schema.rewards, eq(schema.cartItems.rewardId, schema.rewards.id))
    .where(eq(schema.cartItems.userId, targetUserId))
    .orderBy(asc(schema.cartItems.createdAt));

  return rows
    .filter((r) => r.active)
    .map((r) => ({
      rewardId: r.rewardId,
      title: r.title,
      description: r.description,
      points: r.points,
      emoji: r.emoji,
      quantity: r.quantity,
    }));
}

export async function addToCartAction(
  rewardId: string
): Promise<{ success: boolean; cart?: CartItem[]; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId || "user_girlfriend";

    const db = getDb();

    // Verify reward exists and is active
    const rewardRecord = await db
      .select()
      .from(schema.rewards)
      .where(eq(schema.rewards.id, rewardId));

    if (rewardRecord.length === 0 || !rewardRecord[0].active) {
      return { success: false, error: "This reward is currently unavailable." };
    }

    const existing = await db
      .select()
      .from(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.rewardId, rewardId)
        )
      );

    const now = new Date();
    if (existing.length > 0) {
      await db
        .update(schema.cartItems)
        .set({
          quantity: existing[0].quantity + 1,
          updatedAt: now,
        })
        .where(eq(schema.cartItems.id, existing[0].id));
    } else {
      const id = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(schema.cartItems).values({
        id,
        userId,
        rewardId,
        quantity: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    const updatedCart = await getCart(userId);
    return { success: true, cart: updatedCart };
  } catch (err: any) {
    console.error("addToCartAction error:", err);
    return { success: false, error: err.message || "Failed to add to cart" };
  }
}

export async function updateCartQuantityAction(
  rewardId: string,
  delta: number
): Promise<{ success: boolean; cart?: CartItem[]; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId || "user_girlfriend";

    const db = getDb();
    const existing = await db
      .select()
      .from(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.rewardId, rewardId)
        )
      );

    if (existing.length === 0) {
      const updatedCart = await getCart(userId);
      return { success: true, cart: updatedCart };
    }

    const newQuantity = existing[0].quantity + delta;
    if (newQuantity <= 0) {
      await db
        .delete(schema.cartItems)
        .where(eq(schema.cartItems.id, existing[0].id));
    } else {
      await db
        .update(schema.cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(schema.cartItems.id, existing[0].id));
    }

    const updatedCart = await getCart(userId);
    return { success: true, cart: updatedCart };
  } catch (err: any) {
    console.error("updateCartQuantityAction error:", err);
    return { success: false, error: err.message || "Failed to update quantity" };
  }
}

export async function removeFromCartAction(
  rewardId: string
): Promise<{ success: boolean; cart?: CartItem[]; error?: string }> {
  try {
    const session = await getSession();
    const userId = session?.userId || "user_girlfriend";

    const db = getDb();
    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.rewardId, rewardId)
        )
      );

    const updatedCart = await getCart(userId);
    return { success: true, cart: updatedCart };
  } catch (err: any) {
    console.error("removeFromCartAction error:", err);
    return { success: false, error: err.message || "Failed to remove item" };
  }
}

export async function clearCartAction(userId?: string): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    const targetUserId = userId || session?.userId || "user_girlfriend";

    const db = getDb();
    await db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.userId, targetUserId));

    return { success: true };
  } catch (err: any) {
    console.error("clearCartAction error:", err);
    return { success: false };
  }
}
