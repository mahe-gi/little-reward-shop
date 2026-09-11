"use client";

import React from "react";
import { RedemptionOrder } from "@/types";

interface AdminDashboardProps {
  points: number;
  rewardsCount: number;
  orders: RedemptionOrder[];
  onOpenGivePoints: () => void;
  onOpenCreateReward: () => void;
  onQuickAddPoints: (amount: number, reason: string) => void;
  onApproveOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function AdminDashboard({
  points,
  rewardsCount,
  orders,
  onOpenGivePoints,
  onOpenCreateReward,
  onQuickAddPoints,
  onApproveOrder,
  onRejectOrder,
  onNavigateTab,
}: AdminDashboardProps) {
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const latestPending = pendingOrders[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-warm-dark">
            Reward Control Center
          </h2>
          <p className="text-xs text-warm-subtle">
            Everything she wants. Your problem now. 😂
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickAddPoints(1, "Healthy habit completed")}
            className="px-3.5 py-2 bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            + Give 1 Point
          </button>
          <button
            onClick={onOpenCreateReward}
            className="px-3.5 py-2 bg-white border border-warm-border hover:bg-warm-muted active:scale-95 text-warm-dark rounded-xl text-xs font-semibold transition-all"
          >
            Create Reward
          </button>
        </div>
      </div>

      {/* STATS 4-GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-warm-border shadow-soft">
          <div className="text-[11px] font-bold uppercase text-warm-subtle tracking-wider">
            Current Points
          </div>
          <div className="text-3xl font-serif font-bold text-warm-dark mt-1">{points}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for redemption</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-warm-border shadow-soft">
          <div className="text-[11px] font-bold uppercase text-warm-subtle tracking-wider">
            Active Rewards
          </div>
          <div className="text-3xl font-serif font-bold text-warm-dark mt-1">{rewardsCount}</div>
          <div className="text-[11px] text-warm-subtle font-medium mt-1">In her catalog</div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-soft ${
            pendingOrders.length > 0
              ? "bg-amber-50/40 border-2 border-amber-300"
              : "bg-white border-warm-border"
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">
            Pending Orders
          </div>
          <div className="text-3xl font-serif font-bold text-amber-900 mt-1">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {pendingOrders.length > 0 ? "Needs attention! 👀" : "All caught up"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-warm-border shadow-soft">
          <div className="text-[11px] font-bold uppercase text-warm-subtle tracking-wider">
            Completed
          </div>
          <div className="text-3xl font-serif font-bold text-warm-dark mt-1">
            {completedOrders.length}
          </div>
          <div className="text-[11px] text-warm-subtle font-medium mt-1">Delivered treats</div>
        </div>
      </div>

      {/* PENDING ORDER HIGHLIGHT (NEEDS ATTENTION) */}
      {latestPending ? (
        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-serif text-lg font-bold text-warm-dark">
                Needs Your Attention
              </h3>
            </div>
            <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Pending Approval
            </span>
          </div>

          <div className="bg-warm-cream/80 p-4 rounded-xl border border-warm-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs font-bold text-warm-dark">
                {latestPending.orderNumber} · {latestPending.items.length}{" "}
                {latestPending.items.length === 1 ? "reward" : "rewards"} ·{" "}
                {latestPending.totalPoints} points
              </div>
              <div className="text-xs text-warm-subtle mt-1">
                Items: {latestPending.items.map((i) => i.titleSnapshot).join(", ")}
              </div>
              {latestPending.note && (
                <div className="text-xs text-romantic-600 font-medium mt-1.5 italic">
                  &ldquo;{latestPending.note}&rdquo;
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onApproveOrder(latestPending.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Approve Order ({latestPending.totalPoints} pts)
              </button>
              <button
                onClick={() => onRejectOrder(latestPending.id)}
                className="px-3 py-2 bg-white border border-warm-border hover:bg-rose-50 active:scale-95 text-rose-700 rounded-xl text-xs font-semibold transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/80 border border-warm-border shadow-soft flex items-center justify-between text-xs text-warm-subtle">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>You&apos;re all caught up! No pending redemption requests right now.</span>
          </div>
          <button
            onClick={() => onNavigateTab("orders")}
            className="text-romantic-600 font-semibold hover:underline"
          >
            View all orders →
          </button>
        </div>
      )}

      {/* QUICK ACTIONS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-5 rounded-2xl border border-warm-border shadow-soft">
          <h4 className="font-serif text-base font-bold text-warm-dark mb-3">
            Boyfriend Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
            <button
              onClick={() => onQuickAddPoints(1, "Healthy habit verified")}
              className="p-3 rounded-xl bg-romantic-50 hover:bg-romantic-100 text-romantic-700 border border-romantic-200 text-left transition-all active:scale-95"
            >
              <div className="text-base mb-1">🥗</div>
              <div>+1 Healthy Habit</div>
            </button>

            <button
              onClick={() => onQuickAddPoints(1, "Morning walk verified")}
              className="p-3 rounded-xl bg-warm-muted hover:bg-warm-border text-warm-dark border border-warm-border text-left transition-all active:scale-95"
            >
              <div className="text-base mb-1">👟</div>
              <div>+1 Morning Walk</div>
            </button>

            <button
              onClick={onOpenGivePoints}
              className="p-3 rounded-xl bg-warm-muted hover:bg-warm-border text-warm-dark border border-warm-border text-left transition-all active:scale-95"
            >
              <div className="text-base mb-1">🎁</div>
              <div>Custom Points...</div>
            </button>

            <button
              onClick={onOpenCreateReward}
              className="p-3 rounded-xl bg-warm-muted hover:bg-warm-border text-warm-dark border border-warm-border text-left transition-all active:scale-95"
            >
              <div className="text-base mb-1">✨</div>
              <div>Add New Reward</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-warm-border shadow-soft">
          <h4 className="font-serif text-base font-bold text-warm-dark mb-3">
            Recent Activity
          </h4>
          <div className="space-y-2.5 text-xs">
            {orders.slice(0, 3).map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between pb-2 border-b border-warm-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      ord.status === "completed"
                        ? "text-emerald-600"
                        : ord.status === "pending"
                        ? "text-amber-600"
                        : "text-romantic-600"
                    }`}
                  >
                    {ord.status === "completed" ? "✓" : ord.status === "pending" ? "⏳" : "❤️"}
                  </span>
                  <span className="font-medium text-warm-dark">
                    Order {ord.orderNumber} ({ord.items.map((i) => i.titleSnapshot).join(", ")})
                  </span>
                </div>
                <span className="text-warm-subtle text-[11px] capitalize">{ord.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
