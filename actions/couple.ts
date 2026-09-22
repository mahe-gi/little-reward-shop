"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireCouple } from "@/lib/permissions";
import { generateUniqueInviteCode, joinCoupleAtomic } from "@/lib/couple";

export async function touchPresence() {
  try {
    const { user } = await requireCouple();
    const now = new Date();
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { updatedAt: now },
    });
    return { success: true, lastActiveAt: now.toISOString() };
  } catch {
    return { success: false };
  }
}

export async function getCoupleState() {
  try {
    const ctx = await requireCouple();

    // Touch active user's session right now so their live status is current
    const now = new Date();
    await prisma.session.updateMany({
      where: { userId: ctx.user.id },
      data: { updatedAt: now },
    }).catch(() => {});

    // Fetch last-active time for both users from their most-recent session
    const userIds = [ctx.user.id, ctx.partner?.id].filter(Boolean) as string[];
    const latestSessions = await prisma.session.findMany({
      where: { userId: { in: userIds } },
      orderBy: { updatedAt: "desc" },
      distinct: ["userId"],
      select: { userId: true, updatedAt: true },
    });
    const sessionMap = Object.fromEntries(
      latestSessions.map((s) => [s.userId, s.updatedAt.toISOString()])
    );

    // Ensure current active user is registered with current time
    sessionMap[ctx.user.id] = now.toISOString();

    // If partner has no explicit session record yet, check latest activity or user timestamp as fallback
    if (ctx.partner && !sessionMap[ctx.partner.id]) {
      const [latestAct, partnerUser] = await Promise.all([
        prisma.activity.findFirst({
          where: { actorUserId: ctx.partner.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.user.findUnique({
          where: { id: ctx.partner.id },
          select: { updatedAt: true, createdAt: true },
        }),
      ]);

      const fallbackTime = latestAct?.createdAt || partnerUser?.updatedAt || partnerUser?.createdAt;
      if (fallbackTime) {
        sessionMap[ctx.partner.id] = fallbackTime.toISOString();
      }
    }

    return {
      success: true,
      data: {
        ...ctx,
        user: {
          ...ctx.user,
          lastActiveAt: sessionMap[ctx.user.id] ?? now.toISOString(),
        },
        partner: ctx.partner
          ? {
              ...ctx.partner,
              lastActiveAt: sessionMap[ctx.partner.id] ?? null,
            }
          : null,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function getOrCreateCoupleInviteCode() {
  try {
    const user = await requireAuth();

    const existing = await prisma.coupleMember.findUnique({
      where: { userId: user.id },
      include: {
        couple: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (existing?.couple) {
      const partner = existing.couple.members.find((m) => m.userId !== user.id);
      return {
        success: true,
        inviteCode: existing.couple.inviteCode,
        partnerJoined: existing.couple.members.length >= 2,
        partnerName: partner?.user?.name || null,
      };
    }

    const res = await createCoupleSpace(`${user.name || "Our"} Space`);
    if (res.success && res.couple) {
      return {
        success: true,
        inviteCode: res.couple.inviteCode,
        partnerJoined: false,
        partnerName: null,
      };
    }

    return { success: false, error: res.error || "Failed to initialize space" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to get couple code";
    return { success: false, error: msg };
  }
}

export async function checkPartnerConnected() {
  try {
    const user = await requireAuth();
    const existing = await prisma.coupleMember.findUnique({
      where: { userId: user.id },
      include: {
        couple: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!existing?.couple) {
      return { connected: false, partnerName: null };
    }

    const isConnected = existing.couple.members.length >= 2;
    const partner = existing.couple.members.find((m) => m.userId !== user.id);

    return {
      connected: isConnected,
      partnerName: partner?.user?.name || null,
    };
  } catch {
    return { connected: false, partnerName: null };
  }
}

export async function createCoupleSpace(
  name: string = "Our Little Space",
  timezone: string = "UTC"
) {
  try {
    const user = await requireAuth();

    // Verify user doesn't already have an active couple
    const existing = await prisma.coupleMember.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return {
        success: false,
        error: "You already belong to an active couple space.",
      };
    }

    const couple = await prisma.$transaction(async (tx) => {
      const inviteCode = await generateUniqueInviteCode(tx);

      const newCouple = await tx.couple.create({
        data: {
          name: name.trim() || "Our Space",
          inviteCode,
          timezone: timezone || "UTC",
          streakCount: 1,
        },
      });

      await tx.coupleMember.create({
        data: {
          coupleId: newCouple.id,
          userId: user.id,
          role: "INITIATOR",
        },
      });

      // Default sample rewards offered by creator
      await tx.reward.createMany({
        data: [
          {
            coupleId: newCouple.id,
            offeredById: user.id,
            title: "One Big Cozy Hug",
            description: "No rush, tight squeeze whenever needed.",
            cost: 1,
            icon: "❤️",
            category: "LOVE",
          },
          {
            coupleId: newCouple.id,
            offeredById: user.id,
            title: "You Choose Dinner",
            description: "Your pick, zero complaints, treated with love.",
            cost: 5,
            icon: "🍕",
            category: "FOOD",
          },
        ],
      });

      // Default starter task for the user
      await tx.task.create({
        data: {
          coupleId: newCouple.id,
          createdById: user.id,
          assignedToId: user.id,
          title: "Drink 2.5L Water",
          description: "Stay hydrated & energized ❤️",
          points: 1,
          icon: "💧",
        },
      });

      return newCouple;
    });

    revalidatePath("/");
    return { success: true, couple };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create couple space";
    return { success: false, error: msg };
  }
}

export async function joinCoupleSpace(rawCode: string) {
  try {
    const user = await requireAuth();

    const result = await prisma.$transaction(async (tx) => {
      return joinCoupleAtomic(tx, user.id, rawCode);
    });

    revalidatePath("/");
    return { success: true, couple: result.couple };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to join couple space";
    return { success: false, error: msg };
  }
}
