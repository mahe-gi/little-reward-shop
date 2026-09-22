"use client";

import React, { useState, useEffect } from "react";
import {
  checkNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  type NotificationPermissionState,
} from "@/lib/web-push-client";
import { sendTestPushNotification } from "@/actions/notifications";

export function DeviceNotificationToggle({
  onToast,
}: {
  onToast?: (message: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkNotificationPermission().then((res) => {
      setSupported(res.supported);
      setPermission(res.permission);
      setHasSubscription(res.hasSubscription);
    });
  }, []);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (hasSubscription && permission === "granted") {
        const res = await unsubscribeFromPushNotifications();
        if (res.success) {
          setHasSubscription(false);
          onToast?.("Phone notifications paused");
        } else {
          onToast?.(res.error || "Failed to unsubscribe");
        }
      } else {
        const res = await subscribeToPushNotifications();
        if (res.success) {
          setPermission("granted");
          setHasSubscription(true);
          onToast?.("Phone notification bar alerts enabled");

          // Trigger an immediate welcoming local notification
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification("Pairly Notifications Active", {
              body: "You will now receive alerts directly in your phone notification bar!",
              icon: "/icon-192.png",
              badge: "/icon-192.png",
            });
          }
        } else {
          setPermission(Notification.permission as NotificationPermissionState);
          onToast?.(res.error || "Could not enable notifications");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating notification settings";
      onToast?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (testing) return;
    setTesting(true);

    try {
      // 1. Trigger local service worker notification immediately for fast tactile response
      if ("serviceWorker" in navigator && Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("Pairly Test Alert", {
          body: "Your phone notification bar is connected and working!",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: { url: "/home" },
        });
      }

      // 2. Also trigger from server Web Push endpoint
      const res = await sendTestPushNotification();
      if (res.success) {
        onToast?.("Test alert sent to your phone");
      } else {
        onToast?.(res.error || "Test alert sent locally");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not send test notification";
      onToast?.(msg);
    } finally {
      setTesting(false);
    }
  };

  const isEnabled = permission === "granted" && hasSubscription;
  const isBlocked = permission === "denied";

  return (
    <div className="p-4 border-b border-[#EAE6DE]/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1E1A18] text-sm">Phone Notification Bar</span>
            {isEnabled && (
              <span className="text-[10px] font-bold text-[#557567] bg-[#F4F7F5] border border-[#E5EEE9] px-2 py-0.5 rounded-full">
                Active ✓
              </span>
            )}
            {isBlocked && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Blocked
              </span>
            )}
          </div>
          <p className="text-xs text-[#756963] leading-relaxed max-w-[260px]">
            Alerts in your device&apos;s notification tray when your partner adds or completes tasks.
          </p>
        </div>

        {/* Toggle / Action Button */}
        <div>
          {isBlocked ? (
            <span className="text-[11px] text-[#A89F99] font-medium">Check Settings</span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? "bg-[#557567]" : "bg-[#D5CECA]"
              } ${loading ? "opacity-50" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Test Notification Button if enabled */}
      {isEnabled && (
        <div className="pt-1 flex items-center justify-between bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE6DE]">
          <span className="text-xs text-[#756963]">Verify on this device:</span>
          <button
            type="button"
            onClick={handleSendTestAlert}
            disabled={testing}
            className="px-3 py-1 bg-white hover:bg-[#F4F1EA] text-[#1E1A18] border border-[#EAE6DE] rounded-lg text-xs font-semibold shadow-2xs transition-colors active:scale-95 disabled:opacity-50"
          >
            {testing ? "Sending..." : "Send Test Alert"}
          </button>
        </div>
      )}

      {/* Safari notice if outside standalone */}
      {!supported && (
        <p className="text-[11px] text-[#A89F99] italic">
          Tip: On iOS Safari, tap &ldquo;Install App&rdquo; below first to enable lock screen notifications.
        </p>
      )}
    </div>
  );
}
