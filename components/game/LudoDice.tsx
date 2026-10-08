"use client";

import React, { useState } from "react";
import { triggerHaptic } from "@/lib/haptics";

interface LudoDiceProps {
  value: number | null;
  isRolling: boolean;
  disabled: boolean;
  isTurn: boolean;
  hasRolled: boolean;
  onRoll: () => void;
}

export function LudoDice({
  value,
  isRolling,
  disabled,
  isTurn,
  hasRolled,
  onRoll,
}: LudoDiceProps) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (disabled || !isTurn || hasRolled || isRolling) return;
    triggerHaptic("medium");
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    onRoll();
  };

  const renderPips = (num: number) => {
    switch (num) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className="w-4 h-4 rounded-full bg-[#E06D75] shadow-inner" />
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#1E1A18] self-start" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#1E1A18] self-end" />
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-2">
            <span className="w-3 h-3 rounded-full bg-[#1E1A18] self-start" />
            <span className="w-3 h-3 rounded-full bg-[#E06D75] self-center" />
            <span className="w-3 h-3 rounded-full bg-[#1E1A18] self-end" />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-2 w-full h-full p-2.5 items-center justify-items-center">
            <span className="w-3 h-3 rounded-full bg-[#1E1A18]" />
            <span className="w-3 h-3 rounded-full bg-[#1E1A18]" />
            <span className="w-3 h-3 rounded-full bg-[#1E1A18]" />
            <span className="w-3 h-3 rounded-full bg-[#1E1A18]" />
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-2">
            <div className="grid grid-cols-2 gap-3 w-full h-full items-center justify-items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
            </div>
            <span className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#E06D75]" />
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 grid-rows-3 gap-1.5 w-full h-full p-2 items-center justify-items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06D75]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06D75]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1A18]" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-full h-full text-2xl font-serif text-[#BA3F4A]">
            🎲
          </div>
        );
    }
  };

  const canClick = isTurn && !hasRolled && !disabled && !isRolling;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={!canClick}
        aria-label="Roll Dice"
        className={`relative w-16 h-16 rounded-2xl bg-white border-2 transition-all duration-300 flex items-center justify-center select-none ${
          canClick
            ? "border-[#E06D75] shadow-[0_10px_24px_-4px_rgba(224,109,117,0.35)] cursor-pointer active:scale-95 animate-pulse"
            : "border-[#EAE6DE] shadow-xs opacity-90 cursor-not-allowed"
        } ${animating || isRolling ? "rotate-[360deg] scale-110" : "rotate-0 scale-100"}`}
        style={{
          boxShadow: canClick
            ? "0 8px 20px -3px rgba(224, 109, 117, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.9)"
            : undefined,
        }}
      >
        {animating || isRolling ? (
          <span className="text-3xl animate-spin">🎲</span>
        ) : (
          renderPips(value || 1)
        )}

        {/* Small corner 6 bonus badge */}
        {value === 6 && !animating && !isRolling && (
          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#E06D75] text-white text-[10px] font-bold rounded-full shadow-xs">
            +1 Roll!
          </span>
        )}
      </button>

      <div className="text-center">
        {canClick ? (
          <span className="text-xs font-semibold text-[#BA3F4A] animate-pulse">
            ✦ Tap dice to roll
          </span>
        ) : hasRolled ? (
          <span className="text-xs font-medium text-[#756963]">
            Select your pawn ✨
          </span>
        ) : (
          <span className="text-xs text-[#A49B94]">Waiting for turn...</span>
        )}
      </div>
    </div>
  );
}
