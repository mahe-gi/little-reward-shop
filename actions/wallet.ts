"use server";

import { requireAuth } from "@/lib/permissions";
import { calculateAvailablePoints as calcDomainPoints } from "@/lib/points";

export async function calculateAvailablePoints() {
  try {
    const user = await requireAuth();
    const pointsData = await calcDomainPoints(user.id);
    return { success: true, data: pointsData };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to calculate points";
    return { success: false, error: msg };
  }
}
