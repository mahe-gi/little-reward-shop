"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTasks, completeTask } from "@/actions/tasks";
import { getCoupleState } from "@/actions/couple";
import { GiveTaskSheet } from "@/components/tasks/GiveTaskSheet";
import { PillButton } from "@/components/ui/PillButton";
import { Toast } from "@/components/ui/Toast";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  points: number;
  icon: string;
  status: "ASSIGNED" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  assignedToId: string;
  createdById: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "given">("mine");
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [givenTasks, setGivenTasks] = useState<TaskItem[]>([]);
  const [partnerName, setPartnerName] = useState("Partner");
  const [isGiveSheetOpen, setIsGiveSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    const coupleRes = await getCoupleState();
    if (coupleRes.success && coupleRes.data) {
      if (coupleRes.data.partner) {
        setPartnerName(coupleRes.data.partner.name);
      }
    } else {
      router.push("/onboarding/couple");
      return;
    }

    const res = await getTasks();
    if (res.success && res.data) {
      setMyTasks(res.data.myTasks as unknown as TaskItem[]);
      setGivenTasks(res.data.givenTasks as unknown as TaskItem[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComplete = async (task: TaskItem) => {
    if (task.status === "COMPLETED") return;

    const res = await completeTask(task.id);
    if (res.success) {
      setMyTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "COMPLETED" } : t))
      );
      setToastMessage(`🎉 Habit completed! +${task.points} pts added to your wallet.`);
    }
  };

  return (
    <div className="flex-1 p-5 pb-24 space-y-4">
      {/* Top Header & Give Task CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#24201D]">Tasks</h1>
          <p className="text-xs text-[#756963]">Yours and the ones you give.</p>
        </div>
        <PillButton
          variant="primary"
          size="sm"
          className="shadow-2xs font-semibold"
          onClick={() => setIsGiveSheetOpen(true)}
        >
          <span>+ Give Task</span>
        </PillButton>
      </div>

      {/* Bilateral 2-Segment Switcher */}
      <div className="p-1 bg-[#F5F2EB] rounded-2xl flex text-xs font-semibold border border-[#EAE6DE]">
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            tab === "mine"
              ? "bg-white text-[#24201D] shadow-xs"
              : "text-[#756963] hover:text-[#24201D]"
          }`}
        >
          My Tasks
        </button>
        <button
          type="button"
          onClick={() => setTab("given")}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            tab === "given"
              ? "bg-white text-[#24201D] shadow-xs"
              : "text-[#756963] hover:text-[#24201D]"
          }`}
        >
          Given to {partnerName}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#E06D75] border-t-transparent animate-spin" />
        </div>
      ) : tab === "mine" ? (
        <div className="space-y-2.5">
          {myTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-1.5">
              <div className="font-serif text-base font-bold text-[#24201D]">Nothing here yet.</div>
              <p className="text-xs text-[#756963]">
                Ask {partnerName} to give you a task.
              </p>
            </div>
          ) : (
            myTasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F2EB] flex items-center justify-center text-lg shrink-0">
                      {task.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-bold truncate ${
                          isDone ? "line-through text-[#807770]" : "text-[#24201D]"
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-[#756963] truncate">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isDone ? (
                    <span className="text-xs font-bold text-[#557567] bg-[#F4F7F5] px-2.5 py-1 rounded-xl border border-[#E5EEE9] shrink-0">
                      ✓ +{task.points} pts
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleComplete(task)}
                      className="px-3 py-1.5 bg-[#FCEBEE] hover:bg-[#E06D75] hover:text-white text-[#C85A63] font-semibold text-xs rounded-xl transition-all shadow-2xs shrink-0"
                    >
                      Done +{task.points} pts
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {givenTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-3">
              <div className="space-y-1">
                <div className="font-serif text-base font-bold text-[#24201D]">
                  You haven&apos;t given {partnerName} a task yet.
                </div>
                <p className="text-xs text-[#756963]">
                  Give them something nice to accomplish.
                </p>
              </div>
              <PillButton
                variant="primary"
                size="sm"
                className="font-semibold shadow-2xs"
                onClick={() => setIsGiveSheetOpen(true)}
              >
                + Give Task
              </PillButton>
            </div>
          ) : (
            givenTasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F2EB] flex items-center justify-center text-lg shrink-0">
                      {task.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#24201D] truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-[11px] text-[#756963] truncate">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#807770]">
                      +{task.points} pts
                    </span>
                    {isDone ? (
                      <span className="text-xs font-bold text-[#557567] bg-[#F4F7F5] px-2.5 py-1 rounded-xl border border-[#E5EEE9]">
                        Done ✓
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#8E5E1E] bg-[#FFFBF0] px-2 py-0.5 rounded-lg border border-[#FEF3D6]">
                        In progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Give Task Sheet */}
      <GiveTaskSheet
        isOpen={isGiveSheetOpen}
        onClose={() => setIsGiveSheetOpen(false)}
        partnerName={partnerName}
        onTaskGiven={(title, pts) => {
          setToastMessage(`Task "${title}" (+${pts} pts) sent to ${partnerName} ❤️`);
          loadData();
        }}
      />

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
