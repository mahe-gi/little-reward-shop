"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { NotificationItem, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notifications";

export interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onRefresh: () => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "TASK_GIFTED":
      return "✦";
    case "TASK_COMPLETED":
      return "✓";
    case "REWARD_ADDED":
      return "✦";
    case "WISH_REQUESTED":
      return "✧";
    case "WISH_FULFILLED":
      return "✓";
    case "POINTS_GIFTED":
      return "+";
    default:
      return "•";
  }
}

function getNotificationRoute(type: string) {
  switch (type) {
    case "TASK_GIFTED":
    case "TASK_COMPLETED":
      return "/tasks";
    case "REWARD_ADDED":
      return "/rewards";
    case "WISH_REQUESTED":
    case "WISH_FULFILLED":
      return "/requests";
    case "POINTS_GIFTED":
      return "/us";
    default:
      return "/home";
  }
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationsSheet({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onRefresh,
}: NotificationsSheetProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState(false);

  const handleMarkAll = async () => {
    setLoadingAction(true);
    await markAllNotificationsAsRead();
    setLoadingAction(false);
    onRefresh();
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markNotificationAsRead(item.id);
      onRefresh();
    }
    onClose();
    const route = getNotificationRoute(item.type);
    router.push(route);
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Partner Updates"
      subtitle={unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All caught up"}
    >
      <div className="space-y-3 py-1">
        {unreadCount > 0 && (
          <div className="flex justify-end pb-1">
            <button
              type="button"
              disabled={loadingAction}
              onClick={handleMarkAll}
              className="text-xs font-semibold text-[#AB3B46] hover:text-[#BA3F4A] transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center text-xl text-[#756963] mx-auto">
              ✦
            </div>
            <div className="font-serif text-base font-bold text-[#1E1A18]">
              No updates yet
            </div>
            <p className="text-xs text-[#756963] max-w-xs mx-auto">
              When your partner gifts a habit, adds a treat, or completes a task, you will see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto hide-scrollbar pr-0.5">
            {notifications.map((item) => {
              const isUnread = !item.readAt;
              const icon = getNotificationIcon(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 active:scale-[0.99] ${
                    isUnread
                      ? "bg-white border-[#FAD4DA] shadow-2xs hover:border-[#E06D75]"
                      : "bg-[#FAF7F2]/60 border-[#EAE6DE] opacity-85 hover:opacity-100 hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE6DE] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          isUnread ? "font-bold text-[#1E1A18]" : "font-semibold text-[#756963]"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-[#A89F99] shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[#756963] mt-0.5 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#E06D75] shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
