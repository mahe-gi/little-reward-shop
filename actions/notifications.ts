"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { sendPushNotification } from "@/lib/push";

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

function getRouteForNotificationType(type: string): string {
  switch (type) {
    case "TASK_GIFTED":
    case "TASK_COMPLETED":
      return "/tasks";
    case "REWARD_ADDED":
      return "/rewards";
    case "WISH_REQUESTED":
    case "WISH_APPROVED":
    case "WISH_DECLINED":
    case "WISH_FULFILLED":
      return "/requests";
    case "POINTS_GIFTED":
      return "/us";
    default:
      return "/home";
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

    // Send Web Push notification to partner's phone notification bar (PWA)
    const targetUrl = getRouteForNotificationType(type);
    await sendPushNotification(recipientId, {
      title,
      body,
      url: targetUrl,
      icon: "/icon-192.png",
    });

    return { success: true, notification: n };
  } catch (error) {
    console.error("Failed to notify partner:", error);
    return { success: false };
  }
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export async function savePushSubscription(sub: PushSubscriptionInput) {
  try {
    const user = await requireAuth();
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { success: false, error: "Invalid subscription data" };
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save push subscription";
    return { success: false, error: msg };
  }
}

export async function removePushSubscription(endpoint: string) {
  try {
    const user = await requireAuth();
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: user.id,
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to remove push subscription";
    return { success: false, error: msg };
  }
}

export async function sendTestPushNotification() {
  try {
    const user = await requireAuth();

    // Create DB notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "TEST_NOTIFICATION",
        title: "Pairly Notifications Active",
        body: "Phone notification bar alerts are working smoothly on your device!",
      },
    });

    // Send push to phone notification bar
    await sendPushNotification(user.id, {
      title: "Pairly Notifications Active",
      body: "Phone notification bar alerts are working smoothly on your device!",
      url: "/home",
      icon: "/icon-192.png",
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send test notification";
    return { success: false, error: msg };
  }
}

