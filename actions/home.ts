"use server";

import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  referenceId: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface HomeDashboardData {
  user: {
    id: string;
    name: string;
    avatar: string | null;
    pointBalance: number;
  };
  couple: {
    id: string;
    name: string;
    inviteCode: string;
    streakCount: number;
  };
  partner: {
    id: string;
    name: string;
    avatar: string | null;
    pointBalance: number;
  } | null;
  pointsEarnedToday: number;
  partnerTasksCompletedThisWeek: number;
  userTasksCompletedThisWeek: number;
  recentActivities: ActivityItem[];
}

export async function getHomeDashboardData() {
  try {
    const ctx = await requireCouple();
    const { user, couple, partner } = ctx;

    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of current week (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);

    // Run dashboard queries in parallel
    const [earnedTodayAggregate, partnerTasksCompletedThisWeek, userTasksCompletedThisWeek, activities] =
      await Promise.all([
        prisma.walletTransaction.aggregate({
          _sum: { amount: true },
          where: {
            userId: user.id,
            type: "EARN_TASK",
            createdAt: { gte: startOfToday },
          },
        }),
        partner
          ? prisma.task.count({
              where: {
                assignedToId: partner.id,
                status: "COMPLETED",
                completedAt: { gte: startOfWeek },
              },
            })
          : Promise.resolve(0),
        prisma.task.count({
          where: {
            assignedToId: user.id,
            status: "COMPLETED",
            completedAt: { gte: startOfWeek },
          },
        }),
        prisma.activity.findMany({
          where: { coupleId: couple.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

    const pointsEarnedToday = earnedTodayAggregate._sum.amount || 0;

    const serializedActivities: ActivityItem[] = activities.map((act) => ({
      id: act.id,
      type: act.type,
      description: act.description,
      referenceId: act.referenceId,
      createdAt: act.createdAt.toISOString(),
      actor: act.actor,
    }));

    return {
      success: true,
      data: {
        user,
        couple,
        partner,
        pointsEarnedToday,
        partnerTasksCompletedThisWeek,
        userTasksCompletedThisWeek,
        recentActivities: serializedActivities,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load dashboard data";
    return { success: false, error: msg };
  }
}
