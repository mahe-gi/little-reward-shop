"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getNotifications, NotificationItem } from "@/actions/notifications";
import { NotificationsSheet } from "./NotificationsSheet";

export function NotificationBell({ className = "" }: { className?: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUpdates = useCallback(async () => {
    const res = await getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();

    // Poll for new notifications every 25 seconds
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchUpdates();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [fetchUpdates]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs hover:bg-[#FAF7F2] text-[#1E1A18] transition-all active:scale-90 flex items-center justify-center ${className}`}
        aria-label="Partner Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#1E1A18]"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E06D75] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationsSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefresh={fetchUpdates}
      />
    </>
  );
}
