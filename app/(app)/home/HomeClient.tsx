"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HomeDashboardData } from "@/actions/home";
import { completeTask } from "@/actions/tasks";
import { StreakModal } from "@/components/modals/StreakModal";
import { PairlyLogo } from "@/components/ui/PairlyLogo";
import { Toast } from "@/components/ui/Toast";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { DailySparkCard } from "@/components/spark/DailySparkCard";
import { triggerHaptic } from "@/lib/haptics";
import { PartnerBatteryBadge } from "@/components/battery/PartnerBatteryBadge";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  points: number;
  icon: string;
  status: "ASSIGNED" | "COMPLETED" | "EXPIRED" | "CANCELLED";
}

interface HomeClientProps {
  initialData: HomeDashboardData;
  initialTasks: TaskItem[];
}

function formatActivityTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HomeClient({ initialData, initialTasks }: HomeClientProps) {
  const [data, setData] = useState<HomeDashboardData>(initialData);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleComplete = async (task: TaskItem) => {
    if (task.status === "COMPLETED") return;

    triggerHaptic("success");
    const res = await completeTask(task.id);
    if (res.success && res.newBalance !== undefined) {
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, pointBalance: res.newBalance! },
        pointsEarnedToday: prev.pointsEarnedToday + task.points,
        userTasksCompletedThisWeek: prev.userTasksCompletedThisWeek + 1,
      }));
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "COMPLETED" } : t))
      );
      setToastMessage(`Completed habit: "${task.title}" (+${task.points} pts)`);
    } else {
      setToastMessage(res.error || "Failed to complete task");
    }
  };

  const partnerName = data.partner?.name || "Partner";

  return (
    <div className="flex-1 p-4 sm:p-5 pb-24 space-y-4">
      {/* App Header / Brand Greeting & Notification Bell */}
      <div className="flex items-center justify-between px-1">
        <PairlyLogo variant="horizontal" size="sm" />
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <div className="text-right">
            <div className="text-[10px] text-[#756963]">Good day,</div>
            <div className="font-serif text-xs sm:text-sm font-bold text-[#1E1A18] truncate max-w-[120px]">
              {data.user.name}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Dual Presence Card */}
      <div className="rounded-3xl bg-linear-to-br from-[#E06D75] via-[#D05D66] to-[#BA3F4A] p-5 text-white shadow-[0_14px_36px_-8px_rgba(224,109,117,0.42)] relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Shared Wallet
                </span>
                {data.couple.streakCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStreakModalOpen(true)}
                    className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold backdrop-blur-xs transition-colors"
                  >
                    {data.couple.streakCount}d streak ›
                  </button>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight">
                  {data.user.pointBalance}
                </span>
                <span className="text-xs font-semibold text-white/85">points available</span>
              </div>
            </div>

            {/* Partner quick indicator */}
            <div className="text-right bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-white/20 flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-white/80">{partnerName}</span>
                {data.partner && (
                  <PartnerBatteryBadge
                    batteryLevel={data.partner.batteryLevel}
                    isCharging={data.partner.isCharging}
                    partnerName={partnerName}
                  />
                )}
              </div>
              <div className="font-serif text-sm font-bold text-white">
                {data.partner?.pointBalance ?? 0} <span className="text-[10px] font-sans font-normal opacity-85">pts</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-white/95">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-ping" />
              +{data.pointsEarnedToday} pts earned today
            </span>
            <Link
              href="/rewards"
              className="px-3 py-1 rounded-full bg-white text-[#AB3B46] hover:bg-white/90 font-bold text-[11px] shadow-sm transition-transform active:scale-95"
            >
              Treat Yourself →
            </Link>
          </div>
        </div>
      </div>

      {/* Daily Spark (Blind Question & Reveal) */}
      <DailySparkCard
        onToast={setToastMessage}
        onPointsEarned={() => {
          setData((prev) => ({
            ...prev,
            user: {
              ...prev.user,
              pointBalance: prev.user.pointBalance + 15,
            },
          }));
        }}
      />

      {/* PWA App Download Option in Middle */}
      <PwaInstallBanner />

      {/* Today's Habits Summary */}
      <div className="p-4 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-[#1E1A18]">
            Today&apos;s Habits
          </h2>
          <Link
            href="/tasks"
            className="text-xs font-semibold text-[#AB3B46] hover:text-[#BA3F4A] transition-colors"
          >
            See All →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#756963] space-y-1">
            <p>No habits scheduled for today.</p>
            <p className="text-[11px] text-[#A89F99]">
              Ask {partnerName} to gift you a habit!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isDone
                      ? "bg-[#FAF7F2]/60 border-[#EAE6DE]/50"
                      : "bg-[#FAF7F2] border-[#EAE6DE] hover:border-[#AB3B46]/40 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{task.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-semibold truncate ${
                          isDone ? "line-through text-[#807770]" : "text-[#1E1A18]"
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[10px] text-[#756963]">
                        +{task.points} pts
                      </div>
                    </div>
                  </div>

                  {isDone ? (
                    <span className="text-[11px] font-bold text-[#557567] bg-[#F4F7F5] px-2.5 py-0.5 rounded-lg border border-[#E5EEE9] shrink-0 animate-pop-check">
                      Done ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComplete(task)}
                      className="px-3 py-1 rounded-xl bg-[#FCEBEE] hover:bg-[#E06D75] hover:text-white text-[#AB3B46] font-bold text-[11px] transition-all active:scale-95 shadow-2xs shrink-0"
                    >
                      Done +{task.points}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity (Clean, compact 3-item minimalist feed) */}
      {data.recentActivities.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-sm font-bold text-[#1E1A18]">
              Recent Activity
            </h3>
            <span className="text-[11px] text-[#756963]">Latest moments</span>
          </div>

          <div className="bg-white rounded-3xl p-3 border border-[#EAE6DE] shadow-2xs divide-y divide-[#EAE6DE]/60">
            {data.recentActivities.slice(0, 3).map((act) => {
              const isTask = act.type.includes("TASK");
              return (
                <div
                  key={act.id}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 text-xs"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                      isTask
                        ? "bg-[#F4F7F5] text-[#557567] border border-[#E5EEE9]"
                        : "bg-[#FCEBEE] text-[#AB3B46] border border-[#FAD4DA]"
                    }`}
                  >
                    {isTask ? "✓" : "✦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#1E1A18] leading-snug">
                      <span className="font-bold">{act.actor.name}</span>{" "}
                      <span className="text-[#756963]">{act.description}</span>
                    </div>
                    <div
                      suppressHydrationWarning
                      className="text-[10px] text-[#A89F99] mt-0.5"
                    >
                      {formatActivityTime(act.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streakCount={data.couple.streakCount}
      />

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
