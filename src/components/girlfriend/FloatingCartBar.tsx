"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const prevCountRef = useRef(totalCount);

  // Trigger internal bump animation ONLY when count or points change and bar is already visible
  useEffect(() => {
    if (totalCount > 0 && prevCountRef.current !== totalCount) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 260);
      prevCountRef.current = totalCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalCount;
  }, [totalCount, totalPoints]);

  const isShown = visible && totalCount > 0;

  return (
    <div
      className={`fixed bottom-20 inset-x-0 px-3 z-30 flex justify-center transition-all duration-300 ease-out ${
        isShown
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <div
        onClick={onViewCart}
        className="w-full max-w-sm bg-gradient-to-r from-stone-900 via-stone-900 to-romantic-950 text-white rounded-2xl p-3 px-4 shadow-float border border-white/10 flex items-center justify-between cursor-pointer select-none active:scale-[0.98] transition-transform duration-150"
      >
        {/* Left Side: Bag Icon + Count + Points */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-xl bg-romantic-500/20 border border-romantic-500/40 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-romantic-400" />
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-sm transition-all duration-200 ${
                isBumping
                  ? "scale-125 bg-romantic-400 text-white shadow-md shadow-romantic-400/50"
                  : "scale-100 bg-romantic-500 text-white"
              }`}
            >
              {totalCount}
            </span>
          </div>

          <div>
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span
                className={`transition-all duration-200 inline-block ${
                  isBumping ? "scale-105 text-white" : "scale-100"
                }`}
              >
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </span>
              <span className="text-stone-500">•</span>
              <span
                className={`font-extrabold transition-all duration-200 inline-block ${
                  isBumping
                    ? "scale-110 text-romantic-200"
                    : "scale-100 text-romantic-300"
                }`}
              >
                {totalPoints} {totalPoints === 1 ? "pt" : "pts"}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              Tap to review & redeem
            </div>
          </div>
        </div>

        {/* Right Side: View Cart Pill */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-romantic-500 hover:bg-romantic-600 text-white text-xs font-bold shadow-md shadow-romantic-500/20 transition-all duration-200 group ${
            isBumping ? "scale-105 shadow-romantic-500/40" : "scale-100"
          }`}
        >
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
