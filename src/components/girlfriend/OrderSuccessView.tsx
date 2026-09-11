"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";

interface OrderSuccessViewProps {
  orderNumber: string;
  totalPoints: number;
  itemsCount: number;
  onViewTimeline: () => void;
  onBackToShop: () => void;
}

export function OrderSuccessView({
  orderNumber,
  totalPoints,
  itemsCount,
  onViewTimeline,
  onBackToShop,
}: OrderSuccessViewProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#e06d75", "#fdebee", "#e8a838"],
      });
    } catch {
      // safe ignore in environments without canvas
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between p-6 text-center bg-gradient-to-b from-warm-cream via-romantic-50/60 to-warm-cream">
      <div className="mt-8">
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="w-full h-full rounded-full bg-romantic-100 flex items-center justify-center text-4xl shadow-soft animate-heart">
            💖
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-float">✨</span>
          <span className="absolute -bottom-1 -left-1 text-xl">🎉</span>
        </div>

        <h2 className="font-serif text-3xl font-bold text-warm-dark">
          Reward request sent ❤️
        </h2>
        <p className="text-xs text-warm-subtle mt-2 max-w-[260px] mx-auto leading-relaxed">
          Your request is now waiting for Mahesh. He&apos;s been notified of his pending duties! 👀
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-white border border-romantic-200/80 shadow-soft text-left">
          <div className="flex justify-between items-center text-xs pb-2.5 border-b border-warm-border">
            <span className="text-warm-subtle">Order ID</span>
            <span className="font-mono font-bold text-warm-dark">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs py-2.5 border-b border-warm-border">
            <span className="text-warm-subtle">Total Rewards</span>
            <span className="font-semibold text-warm-dark">
              {itemsCount} {itemsCount === 1 ? "item" : "items"} ({totalPoints} points)
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5">
            <span className="text-warm-subtle">Current Status</span>
            <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Waiting for Mahesh 👀
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 mb-8">
        <button
          onClick={onViewTimeline}
          className="w-full py-3.5 rounded-xl bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white font-semibold text-xs shadow-soft transition-all"
        >
          View Order Timeline
        </button>
        <button
          onClick={onBackToShop}
          className="w-full py-2.5 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
        >
          Back to Rewards
        </button>
      </div>
    </div>
  );
}
