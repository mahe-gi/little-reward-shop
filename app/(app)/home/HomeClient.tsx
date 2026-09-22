"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HomeDashboardData } from "@/actions/home";
import { completeTask } from "@/actions/tasks";
import { StreakModal } from "@/components/modals/StreakModal";
import { PairlyLogo } from "@/components/ui/PairlyLogo";
import { Toast } from "@/components/ui/Toast";

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

export function HomeClient({ initialData, initialTasks }: HomeClientProps) {
  const [data, setData] = useState<HomeDashboardData>(initialData);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleComplete = async (task: TaskItem) => {
    if (task.status === "COMPLETED") return;

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
      setToastMessage(`🎉 Completed habit: "${task.title}" (+${task.points} pts)`);
    } else {
      setToastMessage(res.error || "Failed to complete task");
    }
  };

  const partnerName = data.partner?.name || "Partner";

  return (
    <div className="flex-1 p-4 sm:p-5 pb-24 space-y-4">
      {/* App Header / Brand Greeting */}
      <div className="flex items-center justify-between px-1">
        <PairlyLogo variant="horizontal" size="sm" />
        <div className="text-right">
          <div className="text-[11px] text-[#756963]">Good day,</div>
          <div className="font-serif text-sm font-bold text-[#24201D] truncate max-w-[140px]">
            {data.user.name}
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                Shared Wallet
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight">
                  {data.user.pointBalance}
                </span>
                <span className="text-xs font-semibold text-white/85">points available</span>
              </div>
            </div>

            {/* Partner quick indicator */}
            <div className="text-right bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-white/20">
              <div className="text-[10px] font-semibold text-white/80">{partnerName}</div>
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
              prefetch={false}
              className="px-3 py-1 rounded-full bg-white text-[#AB3B46] hover:bg-white/90 font-bold text-[11px] shadow-sm transition-transform active:scale-95"
            >
              Treat Yourself →
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Tasks Summary Widget */}
      <div className="p-4 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <h2 className="font-serif text-base font-bold text-[#24201D]">
              Today&apos;s Habits
            </h2>
          </div>
          <Link
            href="/tasks"
            prefetch={false}
            className="text-xs font-semibold text-[#E06D75] hover:text-[#BA3F4A] transition-colors"
          >
            See All →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#756963] space-y-1">
            <p>No habits scheduled for today.</p>
            <p className="text-[11px] text-[#A89F99]">
              Ask {partnerName} to give you a task!
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
                      : "bg-[#FAF7F2] border-[#EAE6DE] hover:border-[#E06D75]/40 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{task.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-semibold truncate ${
                          isDone ? "line-through text-[#807770]" : "text-[#24201D]"
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
                      className="px-3 py-1 rounded-xl bg-[#FCEBEE] hover:bg-[#E06D75] hover:text-white text-[#C85A63] font-bold text-[11px] transition-all active:scale-95 shadow-2xs shrink-0"
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

      {/* Couple Streak Bar (Click opens modal) */}
      <div
        onClick={() => setStreakModalOpen(true)}
        className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs cursor-pointer hover:border-[#E06D75]/40 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFFBF0] border border-[#FEF3D6] flex items-center justify-center text-xl shrink-0">
            🔥
          </div>
          <div>
            <div className="text-xs font-bold text-[#24201D]">
              {data.couple.streakCount}-Day Streak with {partnerName}
            </div>
            <div className="text-[11px] text-[#756963]">
              Keep the momentum going together ❤️
            </div>
          </div>
        </div>
        <span className="text-[#807770] text-sm pr-1">›</span>
      </div>

      {/* Timeline Feed / Recent Activity */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-sm font-bold text-[#24201D]">
            Our Little Timeline
          </h3>
          <span className="text-[11px] text-[#807770]">Recent moments</span>
        </div>

        {data.recentActivities.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-[#EAE6DE] text-center text-xs text-[#756963]">
            No recent activity yet. Start by completing a habit! 🌸
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-3 border border-[#EAE6DE] shadow-xs divide-y divide-[#EAE6DE]/60">
            {data.recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 text-xs"
              >
                <div className="w-7 h-7 rounded-xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {act.type.includes("TASK") ? "✅" : "🎁"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#24201D] leading-snug">
                    <span className="font-bold">{act.actor.name}</span>{" "}
                    <span className="text-[#756963]">{act.description}</span>
                  </div>
                  <div className="text-[10px] text-[#A89F99] mt-0.5">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
