"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface FloatingCartBarProps {
  totalCount: number;
  totalPoints: number;
  onViewCart: () => void;
  visible: boolean;
}

export function FloatingCartBar({
  totalCount,
  totalPoints,
  onViewCart,
  visible,
}: FloatingCartBarProps) {
  const [isBumping, setIsBumping] = useState(false);

  // Trigger tactile bump animation whenever items count changes
  useEffect(() => {
    if (totalCount > 0) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalCount, totalPoints]);

  if (!visible || totalCount <= 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 inset-x-0 px-3 z-30 pointer-events-none flex justify-center">
      <div
        onClick={onViewCart}
        className={`pointer-events-auto w-full max-w-sm bg-gradient-to-r from-stone-900 via-stone-900 to-romantic-950 text-white rounded-2xl p-3 px-4 shadow-float border border-white/10 flex items-center justify-between cursor-pointer select-none transition-all active:scale-[0.98] animate-cart-slide-up ${
          isBumping ? "animate-cart-bump" : ""
        }`}
      >
        {/* Left Side: Bag Icon + Count + Points */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-xl bg-romantic-500/25 border border-romantic-500/40 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-romantic-400" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-romantic-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-sm">
              {totalCount}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-romantic-300 font-extrabold">
                {totalPoints} {totalPoints === 1 ? "pt" : "pts"}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              Tap to review & redeem
            </div>
          </div>
        </div>

        {/* Right Side: View Cart Pill */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-romantic-500/20 transition-all group">
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
