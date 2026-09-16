import { prisma } from "@/lib/prisma";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Calculates available points for a user:
 * AVAILABLE = pointBalance - active PENDING reservations
 */
export async function calculateAvailablePoints(userId: string): Promise<{
  pointBalance: number;
  reservedPoints: number;
  availablePoints: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pointBalance: true },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Active pending reservations from RewardRequest where status is PENDING
  const activePendingRequests = await prisma.rewardRequest.findMany({
    where: {
      userId,
      status: "PENDING",
    },
    select: {
      totalCost: true,
    },
  });

  const reservedPoints = activePendingRequests.reduce(
    (sum: number, req: { totalCost: number }) => sum + req.totalCost,
    0
  );

  const availablePoints = Math.max(0, user.pointBalance - reservedPoints);

  return {
    pointBalance: user.pointBalance,
    reservedPoints,
    availablePoints,
  };
}

/**
 * Creates a PENDING reservation transaction when a request is submitted.
 * Does NOT reduce pointBalance yet.
 */
export async function reservePoints(
  tx: PrismaTx,
  userId: string,
  amount: number,
  requestId: string
) {
  return tx.walletTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: "RESERVE_REQUEST",
      status: "PENDING",
      description: `Points reserved for reward request #${requestId.slice(-6)}`,
      referenceId: requestId,
    },
  });
}

/**
 * Spends points on request approval:
 * Finalizes the reservation transaction and reduces user's pointBalance.
 */
export async function spendPoints(
  tx: PrismaTx,
  userId: string,
  amount: number,
  requestId: string
) {
  // 1. Update the pending reservation to SPEND_REQUEST, FINALIZED
  await tx.walletTransaction.updateMany({
    where: {
      userId,
      referenceId: requestId,
      type: "RESERVE_REQUEST",
    },
    data: {
      type: "SPEND_REQUEST",
      status: "FINALIZED",
      description: `Points redeemed for request #${requestId.slice(-6)}`,
    },
  });

  // 2. Atomically reduce user's pointBalance
  return tx.user.update({
    where: { id: userId },
    data: {
      pointBalance: {
        decrement: amount,
      },
    },
  });
}

/**
 * Releases points on request rejection or cancellation:
 * Marks the reservation as REVERSED, automatically restoring available points.
 */
export async function releasePoints(
  tx: PrismaTx,
  userId: string,
  requestId: string
) {
  return tx.walletTransaction.updateMany({
    where: {
      userId,
      referenceId: requestId,
      type: "RESERVE_REQUEST",
      status: "PENDING",
    },
    data: {
      type: "RELEASE_REQUEST",
      status: "REVERSED",
      description: `Reservation released for request #${requestId.slice(-6)}`,
    },
  });
}

/**
 * Awards points when a task is completed:
 * Increases user pointBalance and records an EARN_TASK transaction.
 */
export async function earnPoints(
  tx: PrismaTx,
  userId: string,
  amount: number,
  description: string,
  taskId?: string
) {
  // 1. Log transaction
  await tx.walletTransaction.create({
    data: {
      userId,
      amount,
      type: "EARN_TASK",
      status: "FINALIZED",
      description,
      referenceId: taskId,
    },
  });

  // 2. Increment user pointBalance
  return tx.user.update({
    where: { id: userId },
    data: {
      pointBalance: {
        increment: amount,
      },
    },
  });
}
