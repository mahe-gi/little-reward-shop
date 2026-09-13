"use client";

import React from "react";
import { Reward, RedemptionOrder, PointTransaction } from "@/types";

interface HerHomeProps {
  points: number;
  featuredRewards: Reward[];
  activeOrder: RedemptionOrder | null;
  onNavigate: (tab: "shop" | "orders" | "cart") => void;
  onSelectReward: (reward: Reward) => void;
  onAddToCart: (reward: Reward) => void;
  onOpenProfile: () => void;
  onViewOrder: (order: RedemptionOrder) => void;
  todayPointsEarned?: number;
  recentTransactions?: PointTransaction[];
}

export function HerHome({
  points,
  featuredRewards,
  activeOrder,
  onNavigate,
  onSelectReward,
  onAddToCart,
  onOpenProfile,
  onViewOrder,
  todayPointsEarned = 0,
  recentTransactions = [],
}: HerHomeProps) {
  // Progress ring calculation (normalized out of 20 points)
  const progressPercent = Math.min(100, Math.round((points / 20) * 100));
  const strokeDash = `${progressPercent}, 100`;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 px-5 pt-3">
      {/* Top Greeting */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-wide uppercase text-romantic-600">
              Hey ❤️
            </span>
            <span className="text-xs">✨</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-warm-dark leading-tight">
            Your little reward world
          </h2>
        </div>
        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full bg-white border border-warm-border flex items-center justify-center text-sm shadow-sm hover:border-romantic-300 transition-colors active:scale-95"
          title="Her Profile"
        >
          👩‍🦰
        </button>
      </div>

      {/* DOMINANT POINTS CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ffffff] via-[#fffbf9] to-[#fbf1f2] border border-romantic-200/80 p-5 shadow-soft mb-5">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-romantic-300/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-warm-subtle">
                Points Available
              </span>
              {todayPointsEarned > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  +{todayPointsEarned} earned today
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-5xl font-extrabold text-warm-dark tracking-tight font-serif">
                {points}
              </span>
              <span className="text-sm font-bold text-romantic-600 uppercase tracking-wider">
                Points
              </span>
            </div>
            <p className="text-xs text-warm-subtle mt-1 flex items-center gap-1">
              <span>You&apos;ve earned them. Spend them wisely 👀</span>
            </p>
          </div>

          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-romantic-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              ></path>
              <path
                className="text-romantic-500"
                strokeDasharray={strokeDash}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              ></path>
            </svg>
            <span className="absolute text-base">👑</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            onClick={() => onNavigate("shop")}
            className="py-2.5 px-3 bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Explore Rewards</span>
            <span>→</span>
          </button>
          <button
            onClick={() => onNavigate("orders")}
            className="py-2.5 px-3 bg-white hover:bg-warm-muted active:scale-[0.98] border border-warm-border text-warm-dark rounded-xl text-xs font-semibold shadow-inner-soft flex items-center justify-center gap-1 transition-all"
          >
            <span>View Orders</span>
          </button>
        </div>

        {/* Real Habit Wins from Database */}
        <div className="mt-4 pt-3.5 border-t border-romantic-100/80">
          <div className="text-[10px] uppercase font-bold text-warm-subtle tracking-wider mb-2 flex items-center justify-between">
            <span>Recent Wins ❤️</span>
            {todayPointsEarned > 0 && (
              <span className="text-romantic-700 bg-romantic-50 border border-romantic-200/80 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                +{todayPointsEarned} pts earned today ✨
              </span>
            )}
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1.5 text-xs">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-white/80 border border-warm-border/60 shadow-xs"
                >
                  <span className="text-warm-dark flex items-center gap-2">
                    <span>✨</span> {tx.reason}
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    +{tx.amount} {tx.amount === 1 ? "pt" : "pts"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2.5 px-3 rounded-xl bg-white/60 border border-warm-border/60 text-center text-xs text-warm-subtle">
              No points awarded yet today. Ready to earn more! 🌟
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE ORDER BANNER */}
      {activeOrder && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-sm relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                ⏳
              </div>
              <div>
                <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Your latest reward order
                </div>
                <div className="text-sm font-bold text-warm-dark mt-0.5">
                  {activeOrder.items.length} {activeOrder.items.length === 1 ? "reward" : "rewards"} · {activeOrder.totalPoints} points
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700 mt-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>
                    Status:{" "}
                    {activeOrder.status === "pending"
                      ? "Waiting for approval 👀"
                      : "Approved & locked in! ❤️"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onViewOrder(activeOrder)}
              className="text-xs font-semibold text-amber-800 bg-white border border-amber-200 hover:bg-amber-50 active:scale-95 px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* FEATURED REWARDS SECTION */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-warm-dark">
              Maybe you&apos;ll like these
            </h3>
            <p className="text-xs text-warm-subtle">Curated rewards catalog</p>
          </div>
          <button
            onClick={() => onNavigate("shop")}
            className="text-xs font-semibold text-romantic-600 hover:underline"
          >
            See All Rewards →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {featuredRewards.slice(0, 3).map((reward) => (
            <div
              key={reward.id}
              className="p-3.5 rounded-2xl bg-white border border-warm-border shadow-sm flex items-center justify-between hover:border-romantic-300 transition-colors"
            >
              <div
                onClick={() => onSelectReward(reward)}
                className="flex items-center space-x-3 cursor-pointer flex-1"
              >
                <div className="w-12 h-12 rounded-xl bg-romantic-50/80 flex items-center justify-center text-2xl border border-romantic-100 shrink-0">
                  {reward.emoji}
                </div>
                <div>
                  <div className="text-sm font-bold text-warm-dark line-clamp-1">
                    {reward.title}
                  </div>
                  <div className="text-xs text-warm-subtle line-clamp-1">
                    {reward.description}
                  </div>
                  <div className="text-xs font-semibold text-romantic-600 mt-0.5">
                    {reward.points} {reward.points === 1 ? "point" : "points"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onAddToCart(reward)}
                className="px-3.5 py-1.5 rounded-xl bg-romantic-50 hover:bg-romantic-100 text-romantic-700 text-xs font-semibold border border-romantic-200 transition-colors active:scale-95 shrink-0 ml-2"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
