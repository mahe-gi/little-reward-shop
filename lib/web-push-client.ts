"use client";

import { savePushSubscription, removePushSubscription } from "@/actions/notifications";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export async function checkNotificationPermission(): Promise<{
  supported: boolean;
  permission: NotificationPermissionState;
  hasSubscription: boolean;
}> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("Notification" in window) ||
    !("PushManager" in window)
  ) {
    return { supported: false, permission: "unsupported", hasSubscription: false };
  }

  const permission = Notification.permission as NotificationPermissionState;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      supported: true,
      permission,
      hasSubscription: Boolean(sub),
    };
  } catch {
    return {
      supported: true,
      permission,
      hasSubscription: false,
    };
  }
}

export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("Notification" in window) ||
    !("PushManager" in window)
  ) {
    return { success: false, error: "Web Push is not supported in this browser." };
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error:
          permission === "denied"
            ? "Notification permission was blocked. Please enable it in your browser settings."
            : "Notification permission was not granted.",
      };
    }

    // 2. Get active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Get VAPID public key
    const vapidPublicKey = VAPID_PUBLIC_KEY;
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // 4. Subscribe with PushManager (with graceful fallback if browser push service is disabled)
    let subscription: PushSubscription | null = null;
    try {
      subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }
    } catch (pushServiceErr) {
      console.warn("Remote push service unavailable (e.g. Brave shields or local FCM):", pushServiceErr);
      // Even if remote push server fails, browser Notification permission was GRANTED!
      // Local serviceWorker.showNotification will still work in the device notification bar.
      return { success: true };
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await savePushSubscription({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        });
      }
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to subscribe to push notifications";
    return { success: false, error: msg };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return { success: false, error: "Push not supported." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await removePushSubscription(endpoint);
    }
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to unsubscribe";
    return { success: false, error: msg };
  }
}
