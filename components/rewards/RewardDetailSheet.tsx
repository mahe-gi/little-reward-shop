"use client";

import React from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";

export interface RewardDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reward: {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon: string;
    category?: string;
  } | null;
  onAddToCart?: (reward: { id: string; title: string; cost: number; icon: string }) => void;
}

export function RewardDetailSheet({
  isOpen,
  onClose,
  reward,
  onAddToCart,
}: RewardDetailSheetProps) {
  if (!reward) return null;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-4 py-2">
        {/* Large Reward Icon Aura */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-[#FCEBEE]/70 blur-md pointer-events-none" />
          <div className="relative w-18 h-18 rounded-3xl bg-white border border-[#FAD4DA] flex items-center justify-center text-4xl shadow-sm">
            {reward.icon}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FCEBEE] text-[#AB3B46] font-bold text-xs border border-[#FAD4DA]">
              ✨ {reward.cost} pts
            </span>
            {reward.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EAE6DE] text-[#756963] font-semibold text-[11px] uppercase tracking-wider">
                {reward.category}
              </span>
            )}
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#1E1A18] tracking-tight">
            {reward.title}
          </h3>
        </div>

        {/* Detailed description card */}
        <div className="bg-[#FAF7F2] border border-[#EAE6DE] rounded-3xl p-4 text-left max-w-sm mx-auto space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#756963]">
            Perks &amp; Intention
          </div>
          <p className="text-xs text-[#1E1A18] leading-relaxed">
            {reward.description?.trim() ? reward.description : "A thoughtful treat handcrafted with love."}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <PillButton
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-xs active:scale-95"
            onClick={() => {
              onAddToCart?.(reward);
              onClose();
            }}
          >
            Add to Wishes ❤️
          </PillButton>

          <PillButton
            variant="ghost"
            size="sm"
            className="w-full text-xs text-[#756963] hover:text-[#1E1A18]"
            onClick={onClose}
          >
            Cancel
          </PillButton>
        </div>
      </div>
    </ModalSheet>
  );
}
