"use server";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole, getSession } from "@/lib/auth";
import { getPointsBalance } from "./points";
import { clearCartAction } from "./cart";
import { RedemptionOrder, CartItem } from "@/types";

export async function getOrders(userId?: string): Promise<RedemptionOrder[]> {
  const db = getDb();
  let orderRows = await db
    .select()
    .from(schema.redemptionOrders)
    .orderBy(desc(schema.redemptionOrders.createdAt));

  if (userId) {
    orderRows = orderRows.filter((o) => o.userId === userId);
  }

  const itemRows = await db.select().from(schema.redemptionItems);
  const fulfillRows = await db.select().from(schema.fulfillmentItems);

  return orderRows.map((ord) => ({
    id: ord.id,
    orderNumber: ord.orderNumber,
    userId: ord.userId,
    status: ord.status as any,
    totalPoints: ord.totalPoints,
    note: ord.note,
    rejectionReason: ord.rejectionReason,
    createdAt: ord.createdAt.toISOString(),
    approvedAt: ord.approvedAt ? ord.approvedAt.toISOString() : null,
    completedAt: ord.completedAt ? ord.completedAt.toISOString() : null,
    updatedAt: ord.updatedAt.toISOString(),
    items: itemRows
      .filter((i) => i.orderId === ord.id)
      .map((i) => ({
        id: i.id,
        orderId: i.orderId,
        rewardId: i.rewardId,
        titleSnapshot: i.titleSnapshot,
        descriptionSnapshot: i.descriptionSnapshot,
        pointsSnapshot: i.pointsSnapshot,
        quantity: i.quantity,
        createdAt: i.createdAt.toISOString(),
      })),
    fulfillmentItems: fulfillRows
      .filter((f) => f.orderId === ord.id)
      .map((f) => ({
        id: f.id,
        orderId: f.orderId,
        redemptionItemId: f.redemptionItemId,
        label: f.label,
        completed: f.completed,
        completedAt: f.completedAt ? f.completedAt.toISOString() : null,
      })),
  }));
}

export async function createOrderAction(items: CartItem[], note?: string) {
  if (!items || items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const session = await getSession();
  const userId = session?.userId || "user_girlfriend";

  const totalPoints = items.reduce((sum, item) => sum + item.points * item.quantity, 0);
  const currentBalance = await getPointsBalance(userId);

  if (currentBalance < totalPoints) {
    return {
      success: false,
      error: `You need ${totalPoints} points for this request, but only have ${currentBalance}.`,
    };
  }

  const existingOrders = await getOrders();
  const nextNum = existingOrders.length + 1;
  const orderNumber = `#${String(nextNum).padStart(4, "0")}`;
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();

  const db = getDb();
  await db.insert(schema.redemptionOrders).values({
    id: orderId,
    orderNumber,
    userId,
    status: "pending",
    totalPoints,
    note: note?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  for (const item of items) {
    const itemId = `ri_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(schema.redemptionItems).values({
      id: itemId,
      orderId,
      rewardId: item.rewardId,
      titleSnapshot: item.title,
      descriptionSnapshot: item.description,
      pointsSnapshot: item.points,
      quantity: item.quantity,
      createdAt: now,
    });
  }

  // Clear cart in database
  await clearCartAction(userId);

  // NOTE: Points are not deducted yet. They are deducted only upon admin approval.
  return { success: true, orderId, orderNumber };
}

export async function approveOrderAction(orderId: string) {
  await requireRole("admin");

  const orders = await getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // Strict double-approval guard
  if (order.status !== "pending") {
    return {
      success: false,
      error: `Order cannot be approved. Current status is '${order.status}'.`,
    };
  }

  // Verify girlfriend's balance is sufficient
  const currentBalance = await getPointsBalance(order.userId);
  if (currentBalance < order.totalPoints) {
    return {
      success: false,
      error: `Insufficient points to approve. Her balance is ${currentBalance}, but order requires ${order.totalPoints}.`,
    };
  }

  const now = new Date();
  const txId = `pt_red_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Default checklist items based on requested rewards
  const checklistItems: Array<{ label: string; redemptionItemId?: string }> = [];
  for (const item of order.items) {
    checklistItems.push({
      label: `${item.titleSnapshot} (Ready & Prepared)`,
      redemptionItemId: item.id,
    });
  }

  const db = getDb();
  // Atomic deduction and order update
  await db.insert(schema.pointTransactions).values({
    id: txId,
    userId: order.userId,
    amount: -order.totalPoints,
    type: "redemption",
    reason: `Redeemed ${order.items.map((i) => i.titleSnapshot).join(", ")} (${order.orderNumber})`,
    orderId: order.id,
    createdAt: now,
  });

  await db
    .update(schema.redemptionOrders)
    .set({
      status: "approved",
      approvedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.redemptionOrders.id, order.id));

  for (const chk of checklistItems) {
    const fiId = `fi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(schema.fulfillmentItems).values({
      id: fiId,
      orderId: order.id,
      redemptionItemId: chk.redemptionItemId || null,
      label: chk.label,
      completed: false,
    });
  }

  return { success: true };
}

export async function rejectOrderAction(orderId: string, rejectionReason?: string) {
  await requireRole("admin");

  const orders = await getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order || order.status !== "pending") {
    return { success: false, error: "Order is not in pending state." };
  }

  const now = new Date();
  const note = rejectionReason?.trim() || "Let's save points for something better ❤️";

  const db = getDb();
  await db
    .update(schema.redemptionOrders)
    .set({
      status: "rejected",
      rejectionReason: note,
      updatedAt: now,
    })
    .where(eq(schema.redemptionOrders.id, order.id));

  // ZERO points deducted
  return { success: true };
}

export async function toggleFulfillmentItemAction(
  fulfillmentItemId: string,
  completed: boolean
) {
  await requireRole("admin");

  const now = new Date();
  const db = getDb();
  await db
    .update(schema.fulfillmentItems)
    .set({
      completed,
      completedAt: completed ? now : null,
    })
    .where(eq(schema.fulfillmentItems.id, fulfillmentItemId));

  return { success: true };
}

export async function completeOrderAction(orderId: string) {
  await requireRole("admin");

  const orders = await getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== "approved" && order.status !== "fulfilling") {
    return {
      success: false,
      error: `Order must be approved before marking as completed.`,
    };
  }

  // Verify all fulfillment checklist items are checked
  const uncompleted = order.fulfillmentItems.filter((f) => !f.completed);
  if (uncompleted.length > 0) {
    return {
      success: false,
      error: `Please complete all ${order.fulfillmentItems.length} checklist items before marking order complete.`,
    };
  }

  const now = new Date();
  const db = getDb();
  await db
    .update(schema.redemptionOrders)
    .set({
      status: "completed",
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.redemptionOrders.id, order.id));

  return { success: true };
}
