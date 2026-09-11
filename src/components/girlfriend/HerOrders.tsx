"use client";

import React, { useState } from "react";
import { RedemptionOrder } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

interface HerOrdersProps {
  orders: RedemptionOrder[];
  onSelectOrder: (order: RedemptionOrder) => void;
  onExploreRewards: () => void;
}

export function HerOrders({
  orders,
  onSelectOrder,
  onExploreRewards,
}: HerOrdersProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = orders.filter((ord) => {
    if (filter === "all") return true;
    if (filter === "pending") return ord.status === "pending";
    if (filter === "approved") return ord.status === "approved" || ord.status === "fulfilling";
    if (filter === "completed") return ord.status === "completed";
    return true;
  });

  const getStatusBadge = (status: RedemptionOrder["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1">
            <span>🟡</span> Waiting for Mahesh
          </span>
        );
      case "approved":
      case "fulfilling":
        return (
          <span className="px-2 py-0.5 rounded-full bg-romantic-50 text-romantic-800 text-[11px] font-bold border border-romantic-200 flex items-center gap-1">
            <span>❤️</span> Approved & Locked in
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
            <span>🟢</span> Completed ❤️
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold border border-stone-200 flex items-center gap-1">
            <span>⚪</span> Not this time
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 px-5 pt-3">
      <div className="mb-3">
        <h2 className="font-serif text-2xl font-bold text-warm-dark">My Orders</h2>
        <p className="text-xs text-warm-subtle">
          Track your requested treats and fulfillment status.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-2 mb-3">
        {["all", "pending", "approved", "completed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all shrink-0 ${
              filter === tab
                ? "bg-romantic-500 text-white font-semibold shadow-xs"
                : "bg-white text-warm-dark border border-warm-border hover:bg-romantic-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white/60 border border-warm-border rounded-3xl mt-4">
          <div className="text-3xl mb-2">🎁</div>
          <h4 className="font-serif text-base font-bold text-warm-dark">Nothing here yet</h4>
          <p className="text-xs text-warm-subtle mt-1 max-w-[200px] mx-auto">
            Maybe it&apos;s time to pick a little reward for yourself!
          </p>
          <button
            onClick={onExploreRewards}
            className="mt-3 px-3.5 py-1.5 bg-romantic-500 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Explore Rewards
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={`p-4 rounded-2xl bg-white border shadow-soft hover:shadow-md transition-all cursor-pointer ${
                order.status === "pending"
                  ? "border-2 border-amber-200/80"
                  : order.status === "completed"
                  ? "border-warm-border opacity-95"
                  : "border-warm-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-warm-dark">
                  {order.orderNumber}
                </span>
                {getStatusBadge(order.status)}
              </div>

              <div className="text-xs text-warm-subtle mt-1.5 flex items-center justify-between">
                <span>
                  {order.items.length} {order.items.length === 1 ? "reward" : "rewards"} ·{" "}
                  {order.totalPoints} points
                </span>
                <span>{formatRelativeTime(order.createdAt)}</span>
              </div>

              <div className="mt-2 text-[11px] text-warm-subtle line-clamp-1">
                {order.items.map((i) => i.titleSnapshot).join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
