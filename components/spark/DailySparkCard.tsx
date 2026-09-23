"use client";

import React, { useState, useEffect } from "react";
import {
  TodaySparkData,
  getTodaySpark,
  submitSparkAnswer,
  shuffleTodayQuestion,
} from "@/actions/spark";
import { SparkHistoryModal } from "./SparkHistoryModal";

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

  useEffect(() => {
    if (!initialData) {
      getTodaySpark().then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
        setLoading(false);
      });
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
          onToast?.("🎉 Daily Spark Unlocked! +15 bonus points awarded to both of you!");
          onPointsEarned?.();
        } else {
          onToast?.("Answer submitted! Your partner has been notified to answer ✨");
        }
        // Refresh data to reflect state
        const refreshed = await getTodaySpark();
        if (refreshed.success && refreshed.data) {
          setData(refreshed.data);
        }
      } else {
        onToast?.(res.error || "Failed to submit answer");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleShuffle = async () => {
    if (shuffling || isUnlocked) return;
    setShuffling(true);
    try {
      const res = await shuffleTodayQuestion();
      if (res.success && res.question) {
        setAnswerInput("");
        onToast?.("Swapped to a fresh question! 🔀");
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
      <div className="rounded-3xl bg-white p-5 border border-[#EAE6DE] shadow-2xs animate-pulse space-y-3">
        <div className="h-4 w-28 bg-[#FAF7F2] rounded-full" />
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

  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFFBF0] p-4 sm:p-5 border border-[#FEF3D6] shadow-2xs space-y-3.5 relative overflow-hidden transition-all">
        {/* Subtle decorative gold sparkle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FEF3D6] rounded-full blur-2xl opacity-70 pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FFFBF0] border border-[#FEF3D6] flex items-center justify-center text-xs text-[#D4AF37] font-bold shadow-2xs">
              ✨
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#AB3B46]">
              Daily Spark
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBF0] text-[#D4AF37] border border-[#FEF3D6]">
              {data.question.category}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isUnlocked && (
              <button
                type="button"
                disabled={shuffling}
                onClick={handleShuffle}
                title="Swap to a different cute question"
                className="text-[11px] font-semibold text-[#756963] hover:text-[#AB3B46] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{shuffling ? "..." : "Swap"}</span>
                <span>🔀</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="text-[11px] font-bold text-[#756963] hover:text-[#AB3B46] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Memories</span>
              <span>📖</span>
            </button>
          </div>
        </div>

        {/* The Daily Question */}
        <div className="relative z-10 space-y-1">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E1A18] tracking-tight leading-snug">
            &ldquo;{data.question.question}&rdquo;
          </h3>
          <p className="text-[11px] text-[#756963]">
            {isUnlocked
              ? "Both answered! See your answers below ✨"
              : hasMyAnswer
              ? `Waiting for ${partnerName} to answer... It will unlock automatically!`
              : `Answer to see what ${partnerName} wrote! ✨`}
          </p>
        </div>

        {/* State 1: Current User Has NOT Answered Yet */}
        {!hasMyAnswer && (
          <div className="relative z-10 space-y-3 pt-1">
            {/* Partner Teaser Lock Banner */}
            {partnerAnswered ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF5F6] via-[#FFFBF0] to-white border border-[#FEF3D6] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl animate-pulse">🔒</span>
                  <div>
                    <div className="font-bold text-xs text-[#AB3B46]">
                      {partnerName} has already answered!
                    </div>
                    <div className="text-[11px] text-[#756963]">
                      Submit your answer below to see what they wrote!
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-xl bg-white border border-[#FEF3D6] text-[10px] font-bold text-[#D4AF37] shrink-0">
                  +15 pts
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE]/60 flex items-center justify-between text-xs text-[#756963]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✍️</span>
                  <span>Neither has answered yet. Be the first!</span>
                </div>
                <span className="text-[10px] font-bold text-[#D4AF37]">
                  +15 pts on unlock
                </span>
              </div>
            )}

            {/* Answer Composer */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Type your answer here..."
                className="w-full p-3 bg-white border border-[#EAE6DE] rounded-2xl text-xs text-[#1E1A18] placeholder:text-[#A89F99] focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-2xs transition-all resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#A89F99]">
                  {answerInput.length}/500 characters
                </span>
                <button
                  type="submit"
                  disabled={!answerInput.trim() || submitting}
                  className="px-4 py-2 bg-[#1E1A18] hover:bg-[#AB3B46] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-[#1E1A18] cursor-pointer flex items-center gap-1.5"
                >
                  <span>{submitting ? "Saving..." : "Lock In & Reveal"}</span>
                  <span>✨</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State 2: Answered by User, Waiting for Partner */}
        {hasMyAnswer && !isUnlocked && (
          <div className="relative z-10 space-y-2.5 pt-1">
            {/* My Submitted Answer */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wider text-[#756963]">
                  Your Answer (Locked In)
                </span>
                <span className="text-[#557567] font-bold">Submitted ✓</span>
              </div>
              <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                &ldquo;{data.myAnswer?.answerText}&rdquo;
              </p>
            </div>

            {/* Partner Blurred Lock Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFFBF0] via-white to-[#FAF7F2] border border-[#FEF3D6] shadow-2xs text-center space-y-1 relative overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white border border-[#FEF3D6] flex items-center justify-center mx-auto text-sm shadow-2xs">
                🔒
              </div>
              <div className="font-bold text-xs text-[#1E1A18]">
                Waiting for {partnerName}&apos;s answer
              </div>
              <p className="text-[11px] text-[#756963] max-w-[260px] mx-auto leading-relaxed">
                As soon as {partnerName} answers, you&apos;ll both receive a notification and unlock +15 streak points!
              </p>
            </div>
          </div>
        )}

        {/* State 3: BOTH ANSWERED — UNLOCKED CELEBRATION! 🎉 */}
        {isUnlocked && (
          <div className="relative z-10 space-y-2.5 pt-1">
            {/* Unlock Celebration Pill */}
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFFBF0] to-[#FFF5F6] border border-[#FEF3D6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#D4AF37]">
                <span>🎉</span>
                <span>Both Answered!</span>
              </div>
              <span className="text-[10px] font-bold text-[#557567] bg-white px-2 py-0.5 rounded-full border border-[#EAE6DE] shadow-2xs">
                +15 pts Earned ✨
              </span>
            </div>

            {/* Side-by-Side or Stacked Reveal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* My Answer */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963]">
                  You wrote:
                </div>
                <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                  &ldquo;{data.myAnswer?.answerText}&rdquo;
                </p>
              </div>

              {/* Partner's Answer */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5F6] to-[#FFFBF0] border border-[#FEF3D6] shadow-2xs space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#AB3B46]">
                  {partnerName} wrote:
                </div>
                <p className="text-xs text-[#1E1A18] leading-relaxed italic">
                  &ldquo;{data.partnerAnswer?.answerText}&rdquo;
                </p>
              </div>
            </div>
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
