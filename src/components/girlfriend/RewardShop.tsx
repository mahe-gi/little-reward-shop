"use client";

import React, { useState } from "react";
import { Reward, RewardCategory } from "@/types";

interface RewardShopProps {
  rewards: Reward[];
  points: number;
  onSelectReward: (reward: Reward) => void;
  onAddToCart: (reward: Reward) => void;
}

const CATEGORIES: RewardCategory[] = [
  "All",
  "Little Things",
  "Treats",
  "Experiences",
  "Special",
];

export function RewardShop({
  rewards,
  points,
  onSelectReward,
  onAddToCart,
}: RewardShopProps) {
  const [activeCategory, setActiveCategory] = useState<RewardCategory>("All");

  const filteredRewards =
    activeCategory === "All"
      ? rewards
      : rewards.filter((r) => r.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-warm-dark">Rewards</h2>
          <p className="text-xs text-warm-subtle">
            You&apos;ve earned them. Now choose your reward.
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-romantic-100 text-romantic-700 text-xs font-bold border border-romantic-200 flex items-center gap-1">
          <span>{points}</span> pts
        </div>
      </div>

      {/* Category Filter Horizontal Scroll */}
      <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar py-2 my-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              activeCategory === cat
                ? "bg-romantic-500 text-white font-semibold shadow-sm"
                : "bg-white text-warm-dark border border-warm-border hover:bg-romantic-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2-COLUMN REWARD GRID */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {filteredRewards.map((reward) => (
          <div
            key={reward.id}
            onClick={() => onSelectReward(reward)}
            className={`cursor-pointer bg-white rounded-2xl p-3.5 border shadow-soft flex flex-col justify-between hover:border-romantic-300 hover:shadow-float transition-all relative ${
              reward.featured ? "border-2 border-romantic-300/80" : "border-warm-border"
            }`}
          >
            {reward.featured && (
              <span className="absolute top-2 right-2 text-[9px] bg-romantic-100 text-romantic-700 px-1.5 py-0.5 rounded font-bold">
                Featured
              </span>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-romantic-50/80 border border-romantic-100 flex items-center justify-center text-xl mb-2.5">
                {reward.emoji}
              </div>
              <div className="font-bold text-xs text-warm-dark line-clamp-1 uppercase tracking-tight">
                {reward.title}
              </div>
              <div className="text-[11px] text-warm-subtle mt-0.5 line-clamp-2 leading-tight">
                &ldquo;{reward.description}&rdquo;
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-warm-border flex items-center justify-between">
              <span className="text-xs font-bold text-romantic-600">
                {reward.points} {reward.points === 1 ? "pt" : "pts"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(reward);
                }}
                className="px-3 py-1 rounded-lg bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
