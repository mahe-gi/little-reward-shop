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
      <div className="text-center space-y-3 py-2">
        {/* Large Reward Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-3xl mx-auto shadow-[0_4px_20px_-2px_rgba(60,45,40,0.04)]">
          {reward.icon}
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold text-[#24201D] tracking-tight">
            {reward.title}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-0.5 rounded-full bg-[#FCEBEE] text-[#AB3B46] font-bold text-xs">
              {reward.cost} points
            </span>
            {reward.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EAE6DE] text-[#756963] font-medium text-[11px] uppercase tracking-wide">
                {reward.category}
              </span>
            )}
          </div>
        </div>

        {/* Detailed description section */}
        <div className="bg-[#FAF7F2] border border-[#EAE6DE] rounded-2xl p-3.5 text-left max-w-sm mx-auto space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#807770]">
            Details &amp; Perks
          </div>
          <p className="text-xs text-[#24201D] leading-relaxed">
            {reward.description?.trim() ? reward.description : "No specific details provided for this reward."}
          </p>
        </div>

        <div className="pt-3 space-y-2">
          <PillButton
            variant="primary"
            size="lg"
            className="w-full shadow-sm"
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
            className="w-full text-xs text-[#756963]"
            onClick={onClose}
          >
            Cancel
          </PillButton>
        </div>
      </div>
    </ModalSheet>
  );
}
