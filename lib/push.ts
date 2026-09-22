import webpush from "web-push";
import { prisma } from "./prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@pairly.app";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping web push");
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return;
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/home",
      icon: payload.icon || "/icon-192.png",
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        // 410 Gone or 404 Not Found means subscription expired or uninstalled
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          await prisma.pushSubscription
            .delete({
              where: { endpoint: sub.endpoint },
            })
            .catch(() => {});
        } else {
          console.error("Failed to send push notification to endpoint:", sub.endpoint, err);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("Error in sendPushNotification:", error);
  }
}
