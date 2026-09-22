"use client";

import React from "react";
import { PillButton } from "../ui/PillButton";
import { RewardsIcon } from "../ui/Icons";

export interface FloatingCartBarProps {
  itemsCount: number;
  totalPoints: number;
  summary?: string;
  onRequest: () => void;
  onOpenCart?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FloatingCartBar({
  itemsCount,
  totalPoints,
  summary,
  onRequest,
  onOpenCart,
  isLoading = false,
  className = "",
}: FloatingCartBarProps) {
  if (itemsCount <= 0) return null;

  return (
    <div
      className={`w-full px-3.5 pb-1 animate-in slide-in-from-bottom-3 duration-300 pointer-events-auto ${className}`}
    >
      <div className="max-w-md mx-auto bg-[#24201D] text-[#FAF7F2] rounded-2xl p-2.5 sm:p-3 shadow-[0_12px_30px_-6px_rgba(36,32,29,0.35)] border border-[#3D3733] flex items-center justify-between gap-3">
        {/* Left: Wish info & count */}
        <div
          onClick={onOpenCart}
          className={`flex items-center gap-3 min-w-0 flex-1 ${
            onOpenCart ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
          }`}
          role={onOpenCart ? "button" : undefined}
          tabIndex={onOpenCart ? 0 : undefined}
          aria-label={onOpenCart ? "View your wish" : undefined}
        >
          {/* Icon with badge */}
          <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-[#FAF7F2]/10 border border-[#FAF7F2]/10">
            <RewardsIcon size={19} className="text-[#E06D75]" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-[#E06D75] text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-[#24201D] shadow-sm">
              {itemsCount}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="font-serif text-sm sm:text-base font-bold text-[#FAF7F2] tracking-tight">
              Your Wish
            </div>
            <p className="text-xs text-[#FAF7F2]/80 truncate mt-0.5 font-normal">
              {summary ||
                `${itemsCount} ${itemsCount === 1 ? "reward" : "rewards"} · ${totalPoints.toLocaleString()} pts`}
            </p>
          </div>
        </div>

        {/* Right: Review Wish CTA */}
        <div className="shrink-0">
          <PillButton
            variant="primary"
            size="sm"
            onClick={onRequest}
            loading={isLoading}
            className="!px-4 !py-2 text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(224,109,117,0.45)] whitespace-nowrap"
          >
            Review Wish →
          </PillButton>
        </div>
      </div>
    </div>
  );
}
