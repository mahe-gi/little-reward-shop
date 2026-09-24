"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";

export interface BatteryStatusResult {
  success: boolean;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  batteryUpdatedAt?: string | null;
  error?: string;
}

/**
 * Updates the current user's battery percentage and charging state.
 * Called automatically by client battery listeners or manually on iOS fallback.
 */
export async function updateBatteryStatus(
  level: number,
  isCharging: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireCouple();

    // Clamp battery level safely between 0 and 100
    const clampedLevel = Math.max(0, Math.min(100, Math.round(level)));
    const chargingBool = Boolean(isCharging);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        batteryLevel: clampedLevel,
        isCharging: chargingBool,
        batteryUpdatedAt: new Date(),
      },
    });

    revalidatePath("/home");
    revalidatePath("/us");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update battery status";
    return { success: false, error: msg };
  }
}

/**
 * Fetches the partner's latest battery level and charging state.
 */
export async function getPartnerBatteryStatus(): Promise<BatteryStatusResult> {
  try {
    const { partner } = await requireCouple();

    if (!partner) {
      return { success: false, error: "No partner linked" };
    }

    const dbPartner = await prisma.user.findUnique({
      where: { id: partner.id },
      select: {
        batteryLevel: true,
        isCharging: true,
        batteryUpdatedAt: true,
      },
    });

    if (!dbPartner) {
      return { success: false, error: "Partner not found" };
    }

    return {
      success: true,
      batteryLevel: dbPartner.batteryLevel,
      isCharging: dbPartner.isCharging,
      batteryUpdatedAt: dbPartner.batteryUpdatedAt
        ? dbPartner.batteryUpdatedAt.toISOString()
        : null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to get partner battery status";
    return { success: false, error: msg };
  }
}
