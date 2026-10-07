"use client";

import React from "react";
import { LudoDare } from "@/lib/ludo-types";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";
import { triggerHaptic } from "@/lib/haptics";

interface LoveDareModalProps {
  dare: LudoDare | null;
  onDismiss: () => void;
}

export function LoveDareModal({ dare, onDismiss }: LoveDareModalProps) {
  if (!dare) return null;

  const handleComplete = () => {
    triggerHaptic("sparkUnlock");
    triggerCelebration({ type: "hearts", count: 35 });
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] border border-[#EAE6DE] shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FCEBEE] flex items-center justify-center text-3xl shadow-inner animate-bounce">
          {dare.type === "kiss" ? "💋" : dare.type === "whisper" ? "🎙️" : "✨"}
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#BA3F4A]">
            Couple Love Dare Tile
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#1E1A18]">
            {dare.title}
          </h3>
          <p className="text-sm text-[#685E58] leading-relaxed px-2 font-sans">
            {dare.description}
          </p>
        </div>

        <button
          type="button"
          onClick={handleComplete}
          className="w-full py-3.5 rounded-full bg-linear-to-r from-[#E06D75] to-[#B43A47] text-white font-semibold text-sm shadow-md shadow-[#E06D75]/25 active:scale-98 transition-all hover:brightness-105 cursor-pointer"
        >
          Done with love! 💖
        </button>
      </div>
    </div>
  );
}
