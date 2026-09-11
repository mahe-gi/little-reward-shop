"use client";

import React from "react";
import { RedemptionOrder } from "@/types";
import { formatDate } from "@/lib/utils";

interface OrderDetailViewProps {
  order: RedemptionOrder;
  onBack: () => void;
}

export function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  const getBannerInfo = () => {
    switch (order.status) {
      case "pending":
        return {
          emoji: "⏳",
          heading: "Waiting for Mahesh 👀",
          desc: "Your request is sitting on his desk. He's deciding your fate!",
          bg: "bg-amber-50 border-amber-200 text-amber-900",
          descColor: "text-amber-700",
        };
      case "approved":
      case "fulfilling":
        return {
          emoji: "😂",
          heading: "Mahesh accepted his fate 😂",
          desc: `Your rewards are officially approved and locked in (${order.totalPoints} points deducted). Get ready!`,
          bg: "bg-romantic-50 border-romantic-200 text-romantic-900",
          descColor: "text-romantic-700",
        };
      case "completed":
        return {
          emoji: "❤️",
          heading: "Delivered with love ❤️",
          desc: "All rewards for this request have been delivered and completed.",
          bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
          descColor: "text-emerald-700",
        };
      case "rejected":
        return {
          emoji: "👀",
          heading: "Not this time 👀",
          desc: order.rejectionReason || "Let's save points for something better ❤️",
          bg: "bg-rose-50 border-rose-200 text-rose-900",
          descColor: "text-rose-700",
        };
    }
  };

  const banner = getBannerInfo();

  const isSentDone = true;
  const isApprovedDone =
    order.status === "approved" ||
    order.status === "fulfilling" ||
    order.status === "completed";
  const isFulfilledDone = order.status === "completed";
  const isCompletedDone = order.status === "completed";

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 px-5 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs text-warm-subtle hover:text-warm-dark flex items-center gap-1 font-medium transition-colors"
        >
          <span>← Back</span>
        </button>
        <span className="font-mono text-xs font-bold text-warm-dark">{order.orderNumber}</span>
        <div className="w-6"></div>
      </div>

      {/* Hero Status Banner */}
      <div className={`p-4 rounded-2xl border mb-4 text-center ${banner.bg}`}>
        <div className="text-2xl mb-1">{banner.emoji}</div>
        <h3 className="font-serif text-lg font-bold">{banner.heading}</h3>
        <p className={`text-xs mt-0.5 ${banner.descColor}`}>{banner.desc}</p>
      </div>

      {/* Items in Order */}
      <div className="p-4 rounded-2xl bg-white border border-warm-border shadow-soft mb-5">
        <div className="text-[11px] font-bold uppercase text-warm-subtle tracking-wider mb-2.5">
          Your Rewards
        </div>
        <div className="space-y-2 text-xs">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="text-warm-dark font-medium">
                {item.titleSnapshot} {item.quantity > 1 ? `×${item.quantity}` : ""}
              </span>
              <span className="font-semibold text-romantic-600">
                {item.pointsSnapshot * item.quantity} pts
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-warm-border flex justify-between font-bold text-warm-dark">
            <span>Total Points</span>
            <span className="text-romantic-600">{order.totalPoints} points</span>
          </div>
          {order.note && (
            <div className="pt-2 border-t border-warm-border text-warm-subtle italic text-[11px]">
              &ldquo;{order.note}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="p-4 rounded-2xl bg-white border border-warm-border shadow-soft">
        <div className="text-[11px] font-bold uppercase text-warm-subtle tracking-wider mb-4">
          Status Timeline
        </div>

        <div className="relative pl-6 space-y-5">
          {/* Vertical Track Line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-warm-border"></div>

          {/* Step 1: Request Sent */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-warm-dark">Request sent</div>
              <div className="text-[10px] text-warm-subtle">{formatDate(order.createdAt)}</div>
            </div>
          </div>

          {/* Step 2: Approved / Rejected */}
          {order.status === "rejected" ? (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                ✕
              </div>
              <div>
                <div className="text-xs font-bold text-rose-700">Request declined</div>
                <div className="text-[10px] text-rose-600 font-medium">0 points deducted</div>
              </div>
            </div>
          ) : (
            <div
              className={`relative flex items-start gap-3 transition-opacity ${
                isApprovedDone ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  isApprovedDone
                    ? "bg-emerald-500 text-white"
                    : "bg-warm-border text-warm-subtle"
                }`}
              >
                {isApprovedDone ? "✓" : "○"}
              </div>
              <div>
                <div className="text-xs font-bold text-warm-dark">Approved by Mahesh</div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  {isApprovedDone ? `${order.totalPoints} points deducted` : "Pending approval"}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Being Fulfilled */}
          {order.status !== "rejected" && (
            <div
              className={`relative flex items-start gap-3 transition-opacity ${
                isApprovedDone ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  isFulfilledDone
                    ? "bg-emerald-500 text-white"
                    : isApprovedDone
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-warm-border text-warm-subtle"
                }`}
              >
                {isFulfilledDone ? "✓" : isApprovedDone ? "⏳" : "○"}
              </div>
              <div>
                <div className="text-xs font-bold text-warm-dark">Being fulfilled</div>
                <div className="text-[10px] text-warm-subtle">
                  {isFulfilledDone
                    ? "All checklist items complete"
                    : isApprovedDone
                    ? "Boyfriend in action mode"
                    : "Awaiting approval"}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Completed */}
          {order.status !== "rejected" && (
            <div
              className={`relative flex items-start gap-3 transition-opacity ${
                isCompletedDone ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  isCompletedDone
                    ? "bg-emerald-500 text-white"
                    : "bg-warm-border text-warm-subtle"
                }`}
              >
                {isCompletedDone ? "✓" : "○"}
              </div>
              <div>
                <div className="text-xs font-bold text-warm-dark">Delivered with love ❤️</div>
                <div className="text-[10px] text-warm-subtle">
                  {order.completedAt ? formatDate(order.completedAt) : "Pending fulfillment"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
