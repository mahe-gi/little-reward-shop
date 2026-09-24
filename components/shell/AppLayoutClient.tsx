"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ResponsiveAppShell } from "@/components/shell/ResponsiveAppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { FloatingCartBar } from "@/components/shell/FloatingCartBar";
import { Toast } from "@/components/ui/Toast";
import { touchPresence } from "@/actions/couple";
import { getNotifications } from "@/actions/notifications";
import { subscribeToPushNotifications } from "@/lib/web-push-client";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { BatterySyncListener } from "@/components/battery/BatterySyncListener";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { items, totalCount, totalCost } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Check standalone mode for prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if ("Notification" in window && Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("pairly_notif_prompt_dismissed");
      if (!dismissed) {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  // Register Service Worker & Heartbeat
  useEffect(() => {
    // 1. Service worker registration for PWA & Push
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. Initial touch presence
    let isTouching = false;
    const doTouch = () => {
      if (isTouching) return;
      isTouching = true;
      touchPresence()
        .catch(() => {})
        .finally(() => {
          isTouching = false;
        });
    };

    doTouch();

    // Heartbeat every 45s
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        doTouch();
      }
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        doTouch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Poll for partner notifications in real-time
  useEffect(() => {
    let latestKnownId: string | null = null;
    let initialized = false;
    let isChecking = false;

    const checkNotifications = async () => {
      if (isChecking) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      isChecking = true;
      try {
        const res = await getNotifications();
      if (res.success && res.data && res.data.notifications.length > 0) {
        const newest = res.data.notifications[0];

        // On first run, just record the latest ID without alert spam
        if (!initialized) {
          latestKnownId = newest.id;
          initialized = true;
          return;
        }

        // If a brand new unread notification arrived
        if (newest.id !== latestKnownId && !newest.readAt) {
          latestKnownId = newest.id;
          setToastMessage(`${newest.title} — ${newest.body}`);

          // Also trigger Web Notification in phone notification bar if permitted
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(newest.title, {
                    body: newest.body,
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                    data: { url: "/home" },
                  });
                });
              } else {
                new Notification(newest.title, {
                  body: newest.body,
                  icon: "/icon-192.png",
                });
              }
            } catch {
              // Fallback
            }
          }
        }
      } else if (!initialized) {
        initialized = true;
      }
    } finally {
      isChecking = false;
    }
  };

  checkNotifications();
    const notifInterval = setInterval(checkNotifications, 20000);

    return () => clearInterval(notifInterval);
  }, []);

  const handleOpenReview = () => {
    if (items.length === 0) return;
    router.push("/rewards/checkout");
  };

  const isCheckoutRoute = pathname === "/rewards/checkout";
  const summary = items.map((i) => `${i.icon} ${i.title}`).join(", ");

  return (
    <ResponsiveAppShell
      footer={
        !isCheckoutRoute ? (
          <div className="flex flex-col w-full pointer-events-none justify-end">
            <FloatingCartBar
              itemsCount={totalCount}
              totalPoints={totalCost}
              summary={summary}
              onRequest={handleOpenReview}
              onOpenCart={handleOpenReview}
            />
            <BottomNav />
          </div>
        ) : undefined
      }
    >
      <NavigationProgress />
      <BatterySyncListener />
      {showNotificationPrompt && (
        <div className="bg-[#FFFBF0] border-b border-[#FEF3D6] px-4 py-2.5 flex items-center justify-between text-xs text-[#24201D] transition-all">
          <div className="flex items-center gap-2">
            <span className="text-[#D4AF37] font-bold">✦</span>
            <span>Enable phone notification bar alerts?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                setShowNotificationPrompt(false);
                const res = await subscribeToPushNotifications();
                if (res.success) {
                  setToastMessage("Notification bar alerts enabled");
                }
              }}
              className="px-2.5 py-1 bg-[#24201D] text-white rounded-lg text-[11px] font-bold shadow-2xs hover:bg-black transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => {
                setShowNotificationPrompt(false);
                sessionStorage.setItem("pairly_notif_prompt_dismissed", "true");
              }}
              className="text-[11px] text-[#756963] hover:text-[#1E1A18]"
            >
              Later
            </button>
          </div>
        </div>
      )}
      {children}

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </ResponsiveAppShell>
  );
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AppShellContent>{children}</AppShellContent>
    </CartProvider>
  );
}
