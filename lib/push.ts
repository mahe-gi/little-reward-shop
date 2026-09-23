import webpush from "web-push";
import { prisma } from "./prisma";
import { VAPID_PUBLIC_KEY } from "./push-config";

const DEFAULT_VAPID_PUBLIC_KEY = VAPID_PUBLIC_KEY;
const DEFAULT_VAPID_PRIVATE_KEY = "ctU8i2o8CYB7fKq0ySLqWaqEL_PCxQaMoordoZTfv2E";
const DEFAULT_VAPID_SUBJECT = "mailto:support@pairly.app";

function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      return true;
    } catch (err) {
      console.error("[WebPush] Failed to set VAPID details:", err);
      return false;
    }
  }
  return false;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!initVapid()) {
    console.warn("[WebPush] VAPID keys not configured, skipping web push");
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
        const error = err as { statusCode?: number; message?: string };
        // 410 Gone, 404 Not Found, 401 Unauthorized, or 403 Forbidden means subscription is invalid or expired
        if (
          error?.statusCode === 410 ||
          error?.statusCode === 404 ||
          error?.statusCode === 401 ||
          error?.statusCode === 403
        ) {
          await prisma.pushSubscription
            .delete({
              where: { endpoint: sub.endpoint },
            })
            .catch(() => {});
        } else {
          console.error("[WebPush] Failed to send push notification to endpoint:", sub.endpoint, err);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("[WebPush] Error in sendPushNotification:", error);
  }
}
