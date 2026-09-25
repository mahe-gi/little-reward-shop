"use server";

import { requireCouple } from "@/lib/permissions";
import { calculateAvailablePoints as calcDomainPoints } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

export async function calculateAvailablePoints() {
  try {
    const user = await requireCouple().then((ctx) => ctx.user);
    const pointsData = await calcDomainPoints(user.id);
    return { success: true, data: pointsData };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to calculate points";
    return { success: false, error: msg };
  }
}

/**
 * Give bonus points to yourself or your partner with a small message.
 * targetUserId must be either the current user or their partner.
 */
export async function giveBonus(
  targetUserId: string,
  amount: number,
  message: string
) {
  try {
    const ctx = await requireCouple();

    const validTargets = [ctx.user.id, ctx.partner?.id].filter(Boolean) as string[];
    if (!validTargets.includes(targetUserId)) {
      return { success: false, error: "You can only give points to yourself or your partner." };
    }

    const pts = Math.max(1, Math.min(100, Math.round(amount)));
    const note = message.trim() || `Bonus from ${ctx.user.name}`;

    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId: targetUserId,
          amount: pts,
          type: "BONUS",
          status: "FINALIZED",
          description: note,
        },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { pointBalance: { increment: pts } },
      });

      // Log activity
      if (ctx.couple) {
        await tx.activity.create({
          data: {
            coupleId: ctx.couple.id,
            actorUserId: ctx.user.id,
            type: "TASK_COMPLETED", // closest available type for a bonus event
            description:
              targetUserId === ctx.user.id
                ? `gave themselves ${pts} bonus pts`
                : `gave ${ctx.partner?.name ?? "partner"} ${pts} bonus pts`,
          },
        });
      }

      if (ctx.partner && targetUserId === ctx.partner.id) {
        await tx.notification.create({
          data: {
            userId: ctx.partner.id,
            type: "POINTS_GIFTED",
            title: "Points Bonus",
            body: `${ctx.user.name} sent you +${pts} points! "${note}"`,
          },
        });
      }
    });

    if (ctx.partner && targetUserId === ctx.partner.id) {
      sendPushNotification(ctx.partner.id, {
        title: "Points Bonus",
        body: `${ctx.user.name} sent you +${pts} points! "${note}"`,
        url: "/us",
      }).catch((err) => console.error("[Push] Bonus points push failed:", err));
    }

    revalidatePath("/us");
    revalidatePath("/home");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to give bonus points";
    return { success: false, error: msg };
  }
}

/**
 * Deduct/remove points from yourself or your partner with a small reason.
 */
export async function deductPoints(
  targetUserId: string,
  amount: number,
  reason: string
) {
  try {
    const ctx = await requireCouple();

    const validTargets = [ctx.user.id, ctx.partner?.id].filter(Boolean) as string[];
    if (!validTargets.includes(targetUserId)) {
      return { success: false, error: "You can only adjust points for yourself or your partner." };
    }

    const pts = Math.max(1, Math.min(100, Math.round(amount)));

    // Check target balance first
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { pointBalance: true, name: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    if (targetUser.pointBalance < pts) {
      return {
        success: false,
        error: `Cannot remove ${pts} pts. Current balance is only ${targetUser.pointBalance} pts.`,
      };
    }

    const note = reason.trim() || `Points deducted by ${ctx.user.name}`;

    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId: targetUserId,
          amount: -pts,
          type: "BONUS",
          status: "FINALIZED",
          description: note,
        },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { pointBalance: { decrement: pts } },
      });

      // Log activity
      if (ctx.couple) {
        await tx.activity.create({
          data: {
            coupleId: ctx.couple.id,
            actorUserId: ctx.user.id,
            type: "TASK_COMPLETED",
            description:
              targetUserId === ctx.user.id
                ? `removed ${pts} pts from their balance`
                : `removed ${pts} pts from ${targetUser.name}`,
          },
        });
      }
    });

    revalidatePath("/us");
    revalidatePath("/home");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to deduct points";
    return { success: false, error: msg };
  }
}

