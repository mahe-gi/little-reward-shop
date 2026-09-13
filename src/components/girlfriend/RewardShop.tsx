"use client";

import React, { useState } from "react";
import { Reward, RewardCategory, CartItem } from "@/types";
import { PrettyIcon } from "@/components/shared/PrettyIcon";
import { Sparkles, Plus, Minus } from "lucide-react";

interface RewardShopProps {
  rewards: Reward[];
  points: number;
  cart?: CartItem[];
  onSelectReward: (reward: Reward) => void;
  onAddToCart: (reward: Reward) => void;
  onUpdateQuantity?: (rewardId: string, delta: number) => void;
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
  cart = [],
  onSelectReward,
  onAddToCart,
  onUpdateQuantity,
}: RewardShopProps) {
  const [activeCategory, setActiveCategory] = useState<RewardCategory>("All");

  const activeRewards = rewards.filter((r) => r.active !== false);
  const filteredRewards =
    activeCategory === "All"
      ? activeRewards
      : activeRewards.filter((r) => r.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 px-4 pt-3">
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
        {filteredRewards.map((reward) => {
          const cartItem = cart.find((item) => item.rewardId === reward.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <div
              key={reward.id}
              onClick={() => onSelectReward(reward)}
              className={`cursor-pointer bg-white rounded-2xl p-3.5 border shadow-soft flex flex-col justify-between hover:border-romantic-300 hover:shadow-float transition-all relative ${
                reward.featured ? "border-2 border-romantic-300/80" : "border-warm-border"
              }`}
            >
              {reward.featured && (
                <span className="absolute top-2 right-2 text-[9px] bg-romantic-100 text-romantic-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-romantic-600" />
                  <span>Featured</span>
                </span>
              )}
              <div>
                <div className="w-10 h-10 rounded-xl bg-romantic-50/80 border border-romantic-100 flex items-center justify-center mb-2.5">
                  <PrettyIcon name={reward.emoji} className="w-5 h-5" />
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

                {quantity > 0 ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center bg-romantic-500 text-white rounded-lg shadow-xs overflow-hidden h-7"
                  >
                    <button
                      onClick={() => onUpdateQuantity?.(reward.id, -1)}
                      className="w-6 h-7 hover:bg-romantic-600 active:scale-75 transition-all flex items-center justify-center text-white select-none"
                      title="Decrease"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold select-none text-white transition-transform">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity?.(reward.id, 1)}
                      className="w-6 h-7 hover:bg-romantic-600 active:scale-75 transition-all flex items-center justify-center text-white select-none"
                      title="Increase"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(reward);
                    }}
                    className="h-7 px-3 rounded-lg bg-white border border-romantic-300 hover:bg-romantic-50 active:scale-95 text-romantic-600 text-xs font-bold shadow-xs transition-all flex items-center gap-1 uppercase tracking-wide select-none"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
