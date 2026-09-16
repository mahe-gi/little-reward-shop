"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getHomeDashboardData, HomeDashboardData } from "@/actions/home";
import { getTasks, completeTask } from "@/actions/tasks";
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

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    const dashRes = await getHomeDashboardData();
    if (dashRes.success && dashRes.data) {
      setData(dashRes.data);
    } else {
      router.push("/onboarding/couple");
      return;
    }
    const taskRes = await getTasks();
    if (taskRes.success && taskRes.data) {
      setTasks(taskRes.data.myTasks as unknown as TaskItem[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async (task: TaskItem) => {
    if (task.status === "COMPLETED") return;

    const res = await completeTask(task.id);
    if (res.success && res.newBalance !== undefined) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              user: { ...prev.user, pointBalance: res.newBalance! },
            }
          : null
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "COMPLETED" } : t))
      );
      setToastMessage(`✨ ${task.title} finished! +${task.points} points added!`);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-[#E06D75] border-t-transparent animate-spin" />
      </div>
    );
  }

  const partnerName = data.partner?.name || "Partner";

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCount = tasks.length;

  return (
    <div className="flex-1 p-5 pb-24 space-y-4">
      {/* Top Brand & Greeting */}
      <div className="space-y-1">
        <PairlyLogo variant="horizontal" size="sm" />
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#24201D] tracking-tight">
          Hey {data.user.name} <span className="animate-heartbeat inline-block">❤️</span>
        </h1>
      </div>

      {/* Hero Points Card */}
      <div className="rounded-3xl bg-white border border-[#FAD4DA] p-5 shadow-[0_10px_30px_-4px_rgba(44,32,28,0.06)] relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold text-[#24201D] tracking-tight">
                {data.user.pointBalance}
              </span>
              <span className="text-sm font-semibold text-[#E06D75]">
                pts
              </span>
            </div>
            <p className="text-xs text-[#756963] mt-1">
              Earned from things you&apos;ve completed together.
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-xl shadow-2xs">
            🎁
          </div>
        </div>

        <div className="pt-2 border-t border-[#F5F2EB] flex relative z-10">
          <Link
            href="/rewards"
            className="w-full py-2.5 px-4 bg-[#E06D75] hover:bg-[#C85A63] text-white font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
          >
            <span>Browse {partnerName}&apos;s Rewards</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-3xl p-4 border border-[#EAE6DE] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-[#24201D]">
              Today&apos;s Tasks
            </h2>
            {totalCount > 0 && (
              <p className="text-[11px] text-[#756963]">
                {completedCount} of {totalCount} done
              </p>
            )}
          </div>
          <Link
            href="/tasks"
            className="text-xs font-semibold text-[#E06D75] hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="space-y-2 text-xs">
          {tasks.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-[#807770]">
              Nothing here yet. Ask {partnerName} to give you a task.
            </div>
          ) : (
            tasks.slice(0, 3).map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isDone
                      ? "bg-[#FAF7F2]/60 border-[#EAE6DE]/80 opacity-80"
                      : "bg-white border-[#EAE6DE] hover:border-[#E06D75]/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <span className="text-base shrink-0">{task.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`font-medium block truncate ${
                          isDone ? "line-through text-[#807770]" : "text-[#24201D]"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-[10px] text-[#807770] block truncate">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isDone ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F7F5] text-[#557567] shrink-0">
                      ✓ +{task.points} pts
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComplete(task)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FCEBEE] hover:bg-[#E06D75] text-[#C85A63] hover:text-white transition-all shrink-0 shadow-2xs"
                    >
                      Done +{task.points} pts
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Couple Streak Bar */}
      <div
        onClick={() => setStreakModalOpen(true)}
        className="cursor-pointer bg-[#FFFBF0]/90 hover:bg-[#FFFBF0] border border-[#FEF3D6] rounded-2xl p-3 px-3.5 flex items-center justify-between shadow-2xs transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔥</span>
          <div>
            <div className="text-xs font-bold text-[#24201D]">
              {data.couple.streakCount}-Day Couple Streak
            </div>
            <div className="text-[11px] text-[#756963]">
              You both showed up today.
            </div>
          </div>
        </div>
        <span className="text-sm font-semibold text-[#756963]">›</span>
      </div>

      {/* Our Little Timeline */}
      <div className="bg-white rounded-3xl p-4 border border-[#EAE6DE] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-[#24201D]">
            Our Little Timeline
          </h2>
          <span className="text-[11px] text-[#756963]">
            The little things you&apos;ve done together.
          </span>
        </div>

        <div className="space-y-2 text-xs divide-y divide-[#EAE6DE]/60 pt-1">
          {data.recentActivities.length > 0 ? (
            data.recentActivities.map((act) => {
              const isMe = act.actor.id === data.user.id;
              const isTask = act.type.startsWith("TASK_");
              const isRequest = act.type.startsWith("REQUEST_");

              const badgeIcon = isTask ? "✓" : isRequest ? "💌" : "🎁";
              const badgeColor = isTask
                ? "bg-[#F4F7F5] text-[#557567]"
                : isRequest
                ? "bg-[#FFFBF0] text-[#D99B26]"
                : "bg-[#FCEBEE] text-[#E06D75]";

              const formattedDate = new Date(act.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div key={act.id} className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg ${badgeColor} flex items-center justify-center text-xs font-bold shrink-0`}
                    >
                      {badgeIcon}
                    </span>
                    <span className="text-[#24201D] leading-snug">
                      <span className="font-semibold">{isMe ? "You" : act.actor.name}</span>{" "}
                      {act.description}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#807770] shrink-0 ml-2">
                    {formattedDate}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-[#807770] space-y-0.5">
              <p className="font-medium text-[#24201D]">Nothing here yet.</p>
              <p className="text-[11px]">Your little moments will show up here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
