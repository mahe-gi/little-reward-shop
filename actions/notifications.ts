"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export async function getNotifications() {
  try {
    const user = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    });

    return {
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load notifications";
    return { success: false, error: msg };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update notification";
    return { success: false, error: msg };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    revalidatePath("/home");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to mark notifications";
    return { success: false, error: msg };
  }
}

export async function notifyPartner(
  recipientId: string,
  type: string,
  title: string,
  body: string
) {
  try {
    const n = await prisma.notification.create({
      data: {
        userId: recipientId,
        type,
        title,
        body,
      },
    });
    return { success: true, notification: n };
  } catch (error) {
    console.error("Failed to notify partner:", error);
    return { success: false };
  }
}
