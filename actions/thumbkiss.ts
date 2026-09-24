"use server";

import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";

export interface ThumbKissPingResult {
  success: boolean;
  matched: boolean;
  partnerTouching: boolean;
  partnerName: string;
  error?: string;
}

/**
 * Pings active touch status for the current user and checks whether partner is currently touching.
 * Heartbeat threshold is 3500ms to comfortably accommodate network latency and polling cycles.
 */
export async function pingThumbKiss(
  isTouching: boolean
): Promise<ThumbKissPingResult> {
  try {
    const { user, partner } = await requireCouple();

    if (!partner) {
      return {
        success: false,
        matched: false,
        partnerTouching: false,
        partnerName: "Partner",
        error: "No partner linked yet",
      };
    }

    const now = new Date();

    // Update current user touch timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        thumbKissActiveAt: isTouching ? now : null,
      },
    });

    // Check partner's latest touch timestamp
    const partnerData = await prisma.user.findUnique({
      where: { id: partner.id },
      select: { thumbKissActiveAt: true },
    });

    const partnerActiveAt = partnerData?.thumbKissActiveAt;
    const partnerTouching = Boolean(
      partnerActiveAt &&
        now.getTime() - new Date(partnerActiveAt).getTime() < 3500
    );

    const matched = isTouching && partnerTouching;

    return {
      success: true,
      matched,
      partnerTouching,
      partnerName: partner.name,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to ping ThumbKiss";
    return {
      success: false,
      matched: false,
      partnerTouching: false,
      partnerName: "Partner",
      error: msg,
    };
  }
}

/**
 * Lightweight check to know if partner is currently waiting with their thumb on the screen.
 * Used by the Home button to pulse when partner is active.
 */
export async function getPartnerThumbKissWaiting(): Promise<{
  waiting: boolean;
  partnerName: string;
}> {
  try {
    const { partner } = await requireCouple();
    if (!partner) return { waiting: false, partnerName: "Partner" };

    const partnerData = await prisma.user.findUnique({
      where: { id: partner.id },
      select: { thumbKissActiveAt: true },
    });

    if (!partnerData?.thumbKissActiveAt) {
      return { waiting: false, partnerName: partner.name };
    }

    const diff =
      Date.now() - new Date(partnerData.thumbKissActiveAt).getTime();
    const waiting = diff < 4000;

    return { waiting, partnerName: partner.name };
  } catch {
    return { waiting: false, partnerName: "Partner" };
  }
}

/**
 * Resets the current user's touch timestamp when exiting the ThumbKiss screen.
 */
export async function resetThumbKiss(): Promise<void> {
  try {
    const { user } = await requireCouple();
    await prisma.user.update({
      where: { id: user.id },
      data: { thumbKissActiveAt: null },
    });
  } catch {
    // Fail silently on teardown
  }
}
