"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";

export async function getRewards(category?: string) {
  try {
    const { user, couple, partner } = await requireCouple();

    const filter: { coupleId: string; category?: string } = {
      coupleId: couple.id,
    };

    if (category && category !== "ALL") {
      filter.category = category;
    }

    const allRewards = await prisma.reward.findMany({
      where: filter,
      orderBy: { cost: "asc" },
    });

    // Partner rewards available for user to request
    const partnerRewards = partner
      ? allRewards.filter((r: { offeredById: string; isActive: boolean }) => r.offeredById === partner.id && r.isActive)
      : [];

    // Rewards the current user offers to their partner
    const myOfferedRewards = allRewards.filter((r: { offeredById: string }) => r.offeredById === user.id);

    return {
      success: true,
      data: {
        partnerRewards,
        myOfferedRewards,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load rewards";
    return { success: false, error: msg };
  }
}

export async function createReward(
  title: string,
  description: string,
  cost: number,
  icon: string = "🎁",
  category: string = "LOVE"
) {
  try {
    const { user, couple } = await requireCouple();

    if (!title || !title.trim()) {
      return { success: false, error: "Please enter a reward title." };
    }

    const validCost = Math.max(1, Math.min(cost, 100));

    const reward = await prisma.reward.create({
      data: {
        coupleId: couple.id,
        offeredById: user.id, // Current user offers this treat
        title: title.trim(),
        description: description.trim(),
        cost: validCost,
        icon: icon || "🎁",
        category: category || "LOVE",
        isActive: true,
      },
    });

    revalidatePath("/rewards");
    return { success: true, reward };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create reward";
    return { success: false, error: msg };
  }
}

export async function toggleRewardActive(rewardId: string) {
  try {
    const { user, couple } = await requireCouple();

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || reward.coupleId !== couple.id || reward.offeredById !== user.id) {
      return { success: false, error: "Reward not found or permission denied." };
    }

    const updated = await prisma.reward.update({
      where: { id: rewardId },
      data: { isActive: !reward.isActive },
    });

    revalidatePath("/rewards");
    return { success: true, reward: updated };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to toggle reward";
    return { success: false, error: msg };
  }
}
