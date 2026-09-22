"use client";

import React from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { FlameIcon } from "@/components/ui/Icons";

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
      <div className="text-center space-y-5 py-2">
        {/* Animated flame aura */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-[#FFFBF0] border border-[#FEF3D6] shadow-sm rotate-6" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-[#FFFBF0] to-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-[#E06D75] shadow-xs">
            <FlameIcon size={32} />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Daily Devotion
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#1E1A18] tracking-tight">
            {streakCount}-Day Couple Streak
          </h3>
          <p className="text-xs text-[#756963] max-w-xs mx-auto leading-relaxed">
            Every day you show up and do something thoughtful for each other, your shared flame burns brighter.
          </p>
        </div>

        {/* 7-Day Editorial Matrix */}
        <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#EAE6DE] max-w-xs mx-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963] mb-3">
            This Week&apos;s Momentum
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, idx) => {
              const isToday = idx === todayDayOfWeek;
              const isPast = idx < todayDayOfWeek;
              const isFuture = idx > todayDayOfWeek;
              const daysAgo = todayDayOfWeek - idx;
              const isCompleted = (isToday || isPast) && daysAgo < streakCount;

              return (
                <div key={idx} className="text-center space-y-1">
                  <span
                    className={`text-[10px] font-bold block ${
                      isToday ? "text-[#AB3B46]" : "text-[#756963]"
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto transition-all ${
                      isCompleted && isToday
                        ? "bg-[#AB3B46] text-white shadow-xs scale-105"
                        : isCompleted
                        ? "bg-[#7E9F85] text-white shadow-2xs"
                        : isToday
                        ? "bg-white border-2 border-dashed border-[#AB3B46] text-[#AB3B46]"
                        : isFuture
                        ? "bg-white/60 border border-dashed border-[#EAE6DE] text-stone-300 font-normal"
                        : "bg-white border border-[#EAE6DE] text-[#A89F99] font-normal"
                    }`}
                  >
                    {isCompleted ? "✓" : isToday ? "·" : isFuture ? "·" : "–"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <PillButton
          variant="secondary"
          size="lg"
          className="w-full font-bold active:scale-95 shadow-2xs"
          onClick={onClose}
        >
          Return to Our Space
        </PillButton>
      </div>
    </ModalSheet>
  );
}
