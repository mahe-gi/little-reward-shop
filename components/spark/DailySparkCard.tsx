"use client";

import React, { useState, useEffect } from "react";
import {
  TodaySparkData,
  getTodaySpark,
  submitSparkAnswer,
  shuffleTodayQuestion,
} from "@/actions/spark";
import { SparkHistoryModal } from "./SparkHistoryModal";
import { triggerHaptic } from "@/lib/haptics";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";
import { ShuffleIcon, BookOpenIcon, LockIcon } from "@/components/ui/Icons";

export interface DailySparkCardProps {
  initialData?: TodaySparkData | null;
  onToast?: (message: string) => void;
  onPointsEarned?: () => void;
}

export function DailySparkCard({
  initialData,
  onToast,
  onPointsEarned,
}: DailySparkCardProps) {
  const [data, setData] = useState<TodaySparkData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [answerInput, setAnswerInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!initialData) {
      getTodaySpark().then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          if (
            typeof window !== "undefined" &&
            sessionStorage.getItem(`spark_dismissed_${res.data.question.id}`) === "true"
          ) {
            setIsDismissed(true);
          }
        }
        setLoading(false);
      });
    } else {
      if (
        typeof window !== "undefined" &&
        sessionStorage.getItem(`spark_dismissed_${initialData.question.id}`) === "true"
      ) {
        setIsDismissed(true);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !answerInput.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await submitSparkAnswer(data.question.id, answerInput.trim());
      if (res.success) {
        if (res.isUnlocked) {
          setIsExpanded(true);
          triggerHaptic("sparkUnlock");
          triggerCelebration({ type: "all", count: 65 });
          onToast?.("Daily Spark Unlocked! +15 bonus points awarded to both of you!");
          onPointsEarned?.();
        } else {
          triggerHaptic("medium");
          triggerCelebration({ type: "hearts", count: 25 });
          onToast?.("Answer locked in. Your partner has been notified.");
        }
        const refreshed = await getTodaySpark();
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
      } else {
        triggerHaptic("error");
        onToast?.(res.error || "Failed to submit answer");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleShuffle = async () => {
    if (shuffling || isUnlocked) return;
    triggerHaptic("light");
    setShuffling(true);
    try {
      const res = await shuffleTodayQuestion();
      if (res.success && res.question) {
        setAnswerInput("");
        onToast?.("Swapped to a fresh question.");
        const refreshed = await getTodaySpark();
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
      } else {
        onToast?.(res.error || "Could not swap question");
      }
    } finally {
      setShuffling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#EAE6DE] shadow-2xs animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-[#FAF7F2] rounded-full" />
          <div className="h-4 w-16 bg-[#FAF7F2] rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-[#FAF7F2] rounded-xl" />
        <div className="h-10 w-full bg-[#FAF7F2] rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const partnerName = data.partnerName || "Partner";
  const hasMyAnswer = Boolean(data.myAnswer);
  const partnerAnswered = Boolean(data.partnerAnswer?.answered);
  const isUnlocked = data.isUnlocked;

  // Fully dismissed for the session
  if (isDismissed && isUnlocked) {
    return (
      <SparkHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        partnerName={partnerName}
      />
    );
  }

  // State 1: COMPLETED & COLLAPSED (Sleek 42px micro-row that frees up screen space)
  if (isUnlocked && !isExpanded) {
    return (
      <>
        <div className="rounded-2xl bg-white border border-[#EAE6DE] px-3.5 py-2.5 flex items-center justify-between shadow-2xs gap-2.5 transition-all">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-6 h-6 rounded-full bg-[#F4F7F5] border border-[#E5EEE9] flex items-center justify-center text-xs text-[#557567] font-bold shrink-0">
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E1A18]">Daily Spark</span>
                <span className="text-[10px] font-bold text-[#557567] bg-[#F4F7F5] px-1.5 py-0.2 rounded-md border border-[#E5EEE9]">
                  Done (+15 pts)
                </span>
              </div>
              <p className="text-[11px] text-[#554B45] font-medium truncate">
                &ldquo;{data.question.question}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsExpanded(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#FCEBEE] text-[#BA3F4A] text-xs font-bold transition-all border border-[#EAE6DE] active:scale-95 cursor-pointer"
            >
              Answers ›
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsDismissed(true);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(`spark_dismissed_${data.question.id}`, "true");
                }
              }}
              title="Hide for today"
              className="w-7 h-7 rounded-xl hover:bg-[#FAF7F2] flex items-center justify-center text-[#6B615A] hover:text-[#1E1A18] text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <SparkHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          partnerName={partnerName}
        />
      </>
    );
  }

  // State 2: CLEAN REDESIGNED SANCTUARY CARD (Answering / Waiting / Unlocked)
  return (
    <>
      <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#EAE6DE] shadow-xs space-y-3 relative overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-[#1E1A18]">Daily Spark</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF2F4] text-[#BA3F4A] border border-[#FAD4DA]">
              {data.question.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isUnlocked && (
              <button
                type="button"
                disabled={shuffling}
                onClick={handleShuffle}
                title="Swap question"
                className="text-[11px] font-semibold text-[#554B45] hover:text-[#BA3F4A] px-2 py-1 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShuffleIcon size={12} className="text-[#554B45]" />
                <span>{shuffling ? "..." : "Swap"}</span>
              </button>
            )}

            {isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsExpanded(false);
                }}
                className="text-[11px] font-bold text-[#554B45] hover:text-[#BA3F4A] px-2 py-1 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Collapse
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setHistoryOpen(true);
              }}
              title="View past sparks"
              className="text-[11px] font-semibold text-[#554B45] hover:text-[#BA3F4A] px-2 py-1 rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BookOpenIcon size={12} className="text-[#554B45]" />
              <span>Memories</span>
            </button>
          </div>
        </div>

        {/* The Question */}
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E1A18] tracking-tight leading-snug">
            &ldquo;{data.question.question}&rdquo;
          </h3>
        </div>

        {/* SUB-VIEW 1: User Has NOT Answered Yet */}
        {!hasMyAnswer && (
          <div className="space-y-2.5 pt-0.5">
            {/* Status notice */}
            {partnerAnswered ? (
              <div className="px-3 py-1.5 rounded-xl bg-[#FFF2F4] border border-[#FAD4DA] flex items-center justify-between text-xs text-[#BA3F4A]">
                <div className="flex items-center gap-1.5 font-bold">
                  <LockIcon size={12} className="text-[#BA3F4A]" />
                  <span>{partnerName} already answered</span>
                </div>
                <span className="text-[10px] font-semibold">Answer to reveal (+15 pts)</span>
              </div>
            ) : (
              <div className="text-[11px] text-[#554B45] flex items-center justify-between">
                <span>Both answer to reveal each other&apos;s answer</span>
                <span className="font-bold text-[#BA3F4A]">+15 pts</span>
              </div>
            )}

            {/* Clean Modern Composer */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative">
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder="Type your answer here..."
                  className="w-full p-3 pr-20 bg-[#FAF7F2] border border-[#EAE6DE] rounded-2xl text-xs text-[#1E1A18] placeholder:text-[#6B615A] focus:outline-hidden focus:border-[#BA3F4A] focus:bg-white shadow-2xs transition-all resize-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!answerInput.trim() || submitting}
                  className="absolute right-2.5 bottom-3 px-3 py-1.5 bg-[#1E1A18] hover:bg-[#BA3F4A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-[#1E1A18] cursor-pointer"
                >
                  {submitting ? "..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUB-VIEW 2: User Answered, Waiting for Partner */}
        {hasMyAnswer && !isUnlocked && (
          <div className="space-y-2 pt-0.5">
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wider text-[#554B45]">
                  Your Answer (Locked In)
                </span>
                <span className="text-[#557567] font-bold">Waiting for {partnerName}</span>
              </div>
              <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                &ldquo;{data.myAnswer?.answerText}&rdquo;
              </p>
            </div>

            <div className="px-3 py-2 rounded-xl bg-white border border-[#EAE6DE] flex items-center justify-between text-xs text-[#554B45]">
              <div className="flex items-center gap-1.5">
                <LockIcon size={12} className="text-[#554B45]" />
                <span>Unlocks automatically when {partnerName} answers</span>
              </div>
              <span className="text-[10px] font-bold text-[#BA3F4A]">+15 pts</span>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: Both Answered (Revealed!) */}
        {isUnlocked && (
          <div className="space-y-2.5 pt-0.5">
            {/* Celebration pill */}
            <div className="px-3 py-1 rounded-full bg-[#F4F7F5] border border-[#E5EEE9] flex items-center justify-between text-xs">
              <span className="font-bold text-[#557567]">Both Answered</span>
              <span className="text-[10px] font-bold text-[#557567]">+15 pts Awarded</span>
            </div>

            {/* Revealed Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#554B45]">
                  You wrote:
                </div>
                <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                  &ldquo;{data.myAnswer?.answerText}&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF2F4] border border-[#FAD4DA] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#BA3F4A]">
                  {partnerName} wrote:
                </div>
                <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                  &ldquo;{data.partnerAnswer?.answerText}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsExpanded(false);
              }}
              className="w-full py-1.5 text-center text-xs font-semibold text-[#554B45] hover:text-[#1E1A18] bg-[#FAF7F2] rounded-xl border border-[#EAE6DE] transition-colors cursor-pointer"
            >
              Done · Collapse
            </button>
          </div>
        )}
      </div>

      <SparkHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        partnerName={partnerName}
      />
    </>
  );
}
