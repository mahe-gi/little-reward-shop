"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireCouple,
  verifyRequestRecipient,
  verifyRequestOwner,
} from "@/lib/permissions";
import {
  calculateAvailablePoints,
  reservePoints,
  spendPoints,
  releasePoints,
} from "@/lib/points";
import { sendPushNotification } from "@/lib/push";

export async function submitRewardRequest(
  items: { rewardId: string; quantity: number }[],
  note?: string
) {
  try {
    const { user, couple, partner } = await requireCouple();

    if (!partner) {
      return {
        success: false,
        error: "Your partner has not joined the couple space yet.",
      };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Cart is empty." };
    }

    // Validate quantities are positive integers
    if (items.some((i) => !i.quantity || i.quantity <= 0)) {
      return { success: false, error: "Invalid item quantity." };
    }

    // Fetch all reward records belonging to partner in this couple that are active
    const rewardIds = items.map((i) => i.rewardId);
    const rewards = await prisma.reward.findMany({
      where: {
        id: { in: rewardIds },
        coupleId: couple.id,
        offeredById: partner.id,
        isActive: true,
      },
    });

    if (rewards.length !== items.length) {
      return {
        success: false,
        error: "One or more selected rewards are no longer available or do not belong to your partner.",
      };
    }

    // Calculate total cost
    let totalCost = 0;
    const requestItemData = items.map((item) => {
      const reward = rewards.find((r: { id: string }) => r.id === item.rewardId)!;
      const itemTotal = reward.cost * item.quantity;
      totalCost += itemTotal;
      return {
        rewardId: reward.id,
        title: reward.title,
        icon: reward.icon || "🎁",
        unitCost: reward.cost,
        quantity: item.quantity,
        totalCost: itemTotal,
      };
    });

    // Check available points: pointBalance - active pending reservations
    const { availablePoints } = await calculateAvailablePoints(user.id);
    if (availablePoints < totalCost) {
      return {
        success: false,
        error: `Insufficient available points! Need ${totalCost} pts, but only have ${availablePoints} pts available.`,
      };
    }

    // Transactional creation: Request, Items, Default Checklist, Points Reservation, Activity
    const newRequest = await prisma.$transaction(async (tx) => {
      // 1. Create RewardRequest
      const req = await tx.rewardRequest.create({
        data: {
          coupleId: couple.id,
          userId: user.id,
          targetPartnerId: partner.id,
          totalCost,
          note: note?.trim() || null,
          status: "PENDING",
        },
      });

      // 2. Create RewardRequestItem records
      for (const item of requestItemData) {
        await tx.rewardRequestItem.create({
          data: {
            requestId: req.id,
            rewardId: item.rewardId,
            unitCost: item.unitCost,
            quantity: item.quantity,
            totalCost: item.totalCost,
          },
        });
      }

      // 3. Reserve points in wallet transaction (pointBalance not yet reduced)
      await reservePoints(tx, user.id, totalCost, req.id);

      // 5. Create Activity record
      const summaryTitles = requestItemData.map((i) => i.title).join(", ");
      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "REQUEST_SUBMITTED",
          description: `requested ${summaryTitles} (${totalCost} pts)`,
          referenceId: req.id,
        },
      });

      // 6. Notify Partner
      await tx.notification.create({
        data: {
          userId: partner.id,
          type: "WISH_REQUESTED",
          title: "New Wish Received 💌",
          body: `${user.name} wished for: ${summaryTitles} (${totalCost} pts)`,
        },
      });

      return req;
    });

    const summaryTitles = requestItemData.map((i) => i.title).join(", ");
    sendPushNotification(partner.id, {
      title: "New Wish Received 💌",
      body: `${user.name} wished for: ${summaryTitles} (${totalCost} pts)`,
      url: "/requests",
    }).catch((err) => console.error("[Push] Wish request push failed:", err));

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/rewards");
    return { success: true, request: newRequest };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit request";
    return { success: false, error: msg };
  }
}

export async function getRequests() {
  try {
    const { user, couple } = await requireCouple();

    const allRequests = await prisma.rewardRequest.findMany({
      where: { coupleId: couple.id },
      include: {
        items: {
          include: {
            reward: true,
          },
        },
        fulfillmentItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format requests cleanly for client consumers
    const formatRequest = (r: (typeof allRequests)[number]) => ({
      id: r.id,
      totalPoints: r.totalCost,
      totalCost: r.totalCost,
      note: r.note,
      rejectionReason: r.rejectionReason,
      status: r.status,
      createdAt: r.createdAt.toISOString ? r.createdAt.toISOString() : String(r.createdAt),
      items: r.items.map((i) => ({
        id: i.id,
        rewardId: i.rewardId,
        title: i.reward?.title || "Reward",
        unitCost: i.unitCost,
        quantity: i.quantity,
        totalCost: i.totalCost,
        icon: i.reward?.icon || "🎁",
      })),
      checklist: (r.fulfillmentItems || []).map((f) => ({
        id: f.id,
        label: f.label,
        completed: f.completed,
      })),
    });

    const receivedRequests = allRequests
      .filter((r) => r.targetPartnerId === user.id)
      .map(formatRequest);
    const sentRequests = allRequests
      .filter((r) => r.userId === user.id)
      .map(formatRequest);

    return {
      success: true,
      data: {
        receivedRequests,
        sentRequests,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load requests";
    return { success: false, error: msg };
  }
}

export async function approveRewardRequest(requestId: string) {
  try {
    const { user, couple } = await requireCouple();

    const request = await prisma.rewardRequest.findUnique({
      where: { id: requestId },
      include: { items: true },
    });

    if (!request || request.coupleId !== couple.id) {
      return { success: false, error: "Request not found" };
    }

    verifyRequestRecipient(request, user.id);

    if (request.status !== "PENDING") {
      return { success: false, error: `Cannot approve request in ${request.status} status` };
    }

    // Atomic transaction: finalize reservation to SPEND, reduce requester balance, set status to FULFILLING
    await prisma.$transaction(async (tx) => {
      // 1. Spend points from requester
      await spendPoints(tx, request.userId, request.totalCost, request.id);

      // 2. Update status to FULFILLING
      await tx.rewardRequest.update({
        where: { id: requestId },
        data: {
          status: "FULFILLING",
          approvedAt: new Date(),
        },
      });

      // 3. Activity
      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "REQUEST_APPROVED",
          description: `approved reward wish (${request.totalCost} pts)`,
          referenceId: request.id,
        },
      });

      // 4. In-App Notification
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: "WISH_APPROVED",
          title: "Wish Approved! ❤️",
          body: `${user.name} approved your wish and is working on fulfilling it!`,
        },
      });
    });

    sendPushNotification(request.userId, {
      title: "Wish Approved! ❤️",
      body: `${user.name} approved your wish!`,
      url: "/requests",
    }).catch((err) => console.error("[Push] Wish approved push failed:", err));

    revalidatePath("/");
    revalidatePath("/requests");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to approve request";
    return { success: false, error: msg };
  }
}

export async function rejectRewardRequest(requestId: string, reason?: string) {
  try {
    const { user, couple } = await requireCouple();

    const request = await prisma.rewardRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.coupleId !== couple.id) {
      return { success: false, error: "Request not found" };
    }

    verifyRequestRecipient(request, user.id);

    if (request.status !== "PENDING") {
      return { success: false, error: `Cannot reject request in ${request.status} status` };
    }

    // Atomic transaction: release reservation, mark REJECTED, Activity
    await prisma.$transaction(async (tx) => {
      await releasePoints(tx, request.userId, request.id);

      await tx.rewardRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          rejectionReason: reason?.trim() || null,
        },
      });

      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "REQUEST_REJECTED",
          description: `declined reward request (points refunded)`,
          referenceId: request.id,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: "WISH_DECLINED",
          title: "Wish Update 💌",
          body: `${user.name} declined your wish${reason ? `: "${reason}"` : ""}. Your ${request.totalCost} points were refunded!`,
        },
      });
    });

    sendPushNotification(request.userId, {
      title: "Wish Update 💌",
      body: `${user.name} declined your wish${reason ? `: "${reason}"` : ""}. Points refunded.`,
      url: "/requests",
    }).catch((err) => console.error("[Push] Wish declined push failed:", err));

    revalidatePath("/");
    revalidatePath("/requests");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to reject request";
    return { success: false, error: msg };
  }
}

export async function cancelRewardRequest(requestId: string) {
  try {
    const { user, couple } = await requireCouple();

    const request = await prisma.rewardRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.coupleId !== couple.id) {
      return { success: false, error: "Request not found" };
    }

    // Only the requester can cancel
    verifyRequestOwner(request, user.id);

    if (request.status !== "PENDING") {
      return { success: false, error: `Cannot cancel request in ${request.status} status` };
    }

    // Atomic transaction: release reservation, mark CANCELLED, Activity
    await prisma.$transaction(async (tx) => {
      await releasePoints(tx, user.id, request.id);

      await tx.rewardRequest.update({
        where: { id: requestId },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "REQUEST_CANCELLED",
          description: `cancelled reward wish (points restored)`,
          referenceId: request.id,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/requests");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to cancel request";
    return { success: false, error: msg };
  }
}

export async function toggleChecklistItem(
  requestId: string,
  checklistItemId: string,
  completed: boolean
) {
  try {
    const { couple } = await requireCouple();

    const item = await prisma.fulfillmentItem.findUnique({
      where: { id: checklistItemId },
      include: { request: true },
    });

    if (!item || item.request.coupleId !== couple.id || item.requestId !== requestId) {
      return { success: false, error: "Checklist item not found" };
    }

    const updated = await prisma.fulfillmentItem.update({
      where: { id: checklistItemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    revalidatePath("/requests");
    return { success: true, item: updated };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to toggle checklist item";
    return { success: false, error: msg };
  }
}

export async function fulfillRewardRequest(requestId: string) {
  try {
    const { user, couple } = await requireCouple();

    const request = await prisma.rewardRequest.findUnique({
      where: { id: requestId },
      include: { fulfillmentItems: true },
    });

    if (!request || request.coupleId !== couple.id) {
      return { success: false, error: "Request not found" };
    }

    verifyRequestRecipient(request, user.id);

    // Business rule: ALL checklist items must be completed!
    const uncompleted = request.fulfillmentItems.filter((c: { completed: boolean }) => !c.completed);
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: `Please complete all ${request.fulfillmentItems.length} checklist items before marking delivered!`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.rewardRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "REQUEST_FULFILLED",
          description: `delivered and fulfilled reward with love ❤️`,
          referenceId: request.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: request.userId,
          type: "WISH_FULFILLED",
          title: "Wish Fulfilled! ✨",
          body: `${user.name} delivered and fulfilled your wish!`,
        },
      });
    });

    sendPushNotification(request.userId, {
      title: "Wish Fulfilled! ✨",
      body: `${user.name} delivered and fulfilled your wish!`,
      url: "/requests",
    }).catch((err) => console.error("[Push] Wish fulfilled push failed:", err));

    revalidatePath("/");
    revalidatePath("/requests");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fulfill request";
    return { success: false, error: msg };
  }
}
