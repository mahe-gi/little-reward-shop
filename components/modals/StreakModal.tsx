"use client";

import React from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";

export interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
}

export function StreakModal({ isOpen, onClose, streakCount }: StreakModalProps) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  // Monday = 0, Tuesday = 1, ..., Sunday = 6
  const todayDayOfWeek = (new Date().getDay() + 6) % 7;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] text-[#D99B26] text-3xl flex items-center justify-center mx-auto shadow-sm">
          🔥
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold text-[#24201D]">
            {streakCount}-Day Couple Streak 🔥
          </h3>
          <p className="text-xs text-[#756963] mt-1 max-w-xs mx-auto">
            You&apos;ve both shown up for {streakCount} {streakCount === 1 ? "day" : "days"}.
          </p>
        </div>

        {/* 7-Day Matrix */}
        <div className="grid grid-cols-7 gap-1.5 py-2 max-w-xs mx-auto">
          {days.map((day, idx) => {
            const isToday = idx === todayDayOfWeek;
            const isPast = idx < todayDayOfWeek;
            const isFuture = idx > todayDayOfWeek;
            const daysAgo = todayDayOfWeek - idx;
            const isCompleted = (isToday || isPast) && daysAgo < streakCount;

            return (
              <div key={idx} className="text-center">
                <span
                  className={`text-[10px] font-semibold block mb-1 ${
                    isToday ? "text-[#E06D75] font-bold" : "text-[#807770]"
                  }`}
                >
                  {day}
                </span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto transition-all ${
                    isCompleted && isToday
                      ? "bg-[#E06D75] text-white shadow-xs"
                      : isCompleted
                      ? "bg-[#7E9F85] text-white"
                      : isToday
                      ? "bg-white border-2 border-dashed border-[#E06D75] text-[#E06D75]"
                      : isFuture
                      ? "bg-stone-50 border border-stone-200 text-stone-300 font-normal"
                      : "bg-[#F5F2EB] border border-[#EAE6DE] text-[#A89F99] font-normal"
                  }`}
                >
                  {isCompleted ? "✓" : isToday ? "·" : isFuture ? "·" : "–"}
                </span>
              </div>
            );
          })}
        </div>

        <PillButton variant="secondary" size="md" className="w-full" onClick={onClose}>
          Back to Our Space
        </PillButton>
      </div>
    </ModalSheet>
  );
}
