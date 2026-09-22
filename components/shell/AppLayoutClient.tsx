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

function AppShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { items, totalCount, totalCost } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Register Service Worker & Heartbeat
  useEffect(() => {
    // 1. Service worker registration for PWA & Push
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. Initial touch presence
    touchPresence().catch(() => {});

    // Heartbeat every 45s
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        touchPresence().catch(() => {});
      }
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        touchPresence().catch(() => {});
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

    const checkNotifications = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

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

          // Also trigger Web Notification if permitted
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(newest.title, {
                body: newest.body,
                icon: "/icon-192.png",
              });
            } catch {
              // Fallback
            }
          }
        }
      } else if (!initialized) {
        initialized = true;
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
          <div className="flex flex-col">
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
