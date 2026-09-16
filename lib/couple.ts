import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Generates an 8-character uppercase collision-safe invite code (e.g. LOVE-4821).
 */
export async function generateUniqueInviteCode(tx?: PrismaTx): Promise<string> {
  const db = tx ?? prisma;
  const prefixes = ["LOVE", "PAIR", "BOND", "SOUL", "MINT", "ROSE"];

  for (let attempt = 0; attempt < 10; attempt++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = crypto.randomInt(1000, 9999);
    const candidate = `${prefix}-${randomSuffix}`;

    const existing = await db.couple.findUnique({
      where: { inviteCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  // Fallback with higher entropy
  return `PAIR-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Atomically joins a couple space with strict validation:
 * 1. User has no active couple.
 * 2. Target couple exists.
 * 3. Target couple has strictly < 2 members.
 * 4. User is not joining their own couple.
 */
export async function joinCoupleAtomic(
  tx: PrismaTx,
  userId: string,
  rawInviteCode: string
) {
  const inviteCode = rawInviteCode.trim().toUpperCase();

  // 1. Check if user already has an active couple
  const existingMembership = await tx.coupleMember.findUnique({
    where: { userId },
    include: { couple: { include: { members: true } } },
  });

  if (existingMembership) {
    // If user is already in a 2-person couple, reject
    if (existingMembership.couple.members.length >= 2) {
      throw new Error(
        "ALREADY_IN_COUPLE: You already belong to an active couple space."
      );
    }

    // If user created a solo empty space, safely remove it to join partner
    if (existingMembership.couple.members.length === 1) {
      await tx.coupleMember.delete({ where: { id: existingMembership.id } });
      await tx.reward.deleteMany({ where: { coupleId: existingMembership.coupleId } });
      await tx.task.deleteMany({ where: { coupleId: existingMembership.coupleId } });
      await tx.couple.delete({ where: { id: existingMembership.coupleId } });
    }
  }

  // 2. Find target couple
  const couple = await tx.couple.findUnique({
    where: { inviteCode },
    include: {
      members: true,
    },
  });

  if (!couple) {
    throw new Error(
      "INVALID_CODE: No couple space found matching this invite code."
    );
  }

  // 3. Prevent joining own couple
  if (couple.members.some((m) => m.userId === userId)) {
    throw new Error("CANNOT_JOIN_SELF: You are already a member of this couple.");
  }

  // 4. Strict 2-member limit enforcement
  if (couple.members.length >= 2) {
    throw new Error(
      "COUPLE_FULL: This couple space already has two connected partners."
    );
  }

  // 5. Add CoupleMember atomically
  const member = await tx.coupleMember.create({
    data: {
      coupleId: couple.id,
      userId,
      role: "PARTNER",
    },
  });

  // 6. Log welcome activity
  await tx.activity.create({
    data: {
      coupleId: couple.id,
      actorUserId: userId,
      type: "TASK_CREATED",
      description: "Partner joined the couple space! Welcome! ❤️",
    },
  });

  return { couple, member };
}
