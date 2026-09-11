"use client";

import React from "react";
import { Reward } from "@/types";

interface RewardDetailSheetProps {
  reward: Reward | null;
  isOpen: boolean;
  onClose: () => void;
  availablePoints: number;
  onAddToCart: (reward: Reward) => void;
}

export function RewardDetailSheet({
  reward,
  isOpen,
  onClose,
  availablePoints,
  onAddToCart,
}: RewardDetailSheetProps) {
  if (!isOpen || !reward) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end transition-opacity">
      <div className="bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-warm-border relative transform transition-transform animate-in slide-in-from-bottom duration-200 max-w-[440px] mx-auto w-full">
        {/* Sheet Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-5"></div>

        <div className="text-center mb-4">
          <div className="w-20 h-20 rounded-3xl bg-romantic-50 border border-romantic-100 flex items-center justify-center text-4xl mx-auto shadow-sm mb-3">
            {reward.emoji}
          </div>
          <h3 className="font-serif text-2xl font-bold text-warm-dark">{reward.title}</h3>
          <div className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full bg-romantic-50 text-romantic-700 font-bold text-sm">
            <span>{reward.points} {reward.points === 1 ? "point" : "points"}</span>
          </div>
        </div>

        <p className="text-xs text-warm-subtle text-center leading-relaxed px-4 mb-5">
          {reward.description}
        </p>

        <div className="p-3 bg-warm-muted rounded-xl flex items-center justify-between text-xs text-warm-dark mb-6">
          <span className="text-warm-subtle">Your available balance:</span>
          <span className="font-bold text-romantic-600 font-serif text-sm">
            {availablePoints} points
          </span>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onAddToCart(reward);
              onClose();
            }}
            className="w-full py-3.5 bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white rounded-xl font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-1.5"
          >
            <span>Add to Cart ❤️</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
