"use client";

import React from "react";
import { RedemptionOrder, PointTransaction } from "@/types";
import { formatDate } from "@/lib/utils";

interface AdminHistoryProps {
  orders: RedemptionOrder[];
  pointTransactions: PointTransaction[];
}

export function AdminHistory({ orders, pointTransactions }: AdminHistoryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-warm-dark">Activity & Audit History</h2>
        <p className="text-xs text-warm-subtle">
          Full chronological log of points, redemptions, and order events.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-warm-border shadow-soft p-5 space-y-4">
        <h3 className="font-serif text-base font-bold text-warm-dark">Recent Events</h3>
        <div className="space-y-3 text-xs">
          {pointTransactions.slice(0, 10).map((pt) => (
            <div
              key={pt.id}
              className="flex items-center justify-between py-2 border-b border-warm-border last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    pt.amount > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {pt.amount > 0 ? "+" : "−"}
                </span>
                <div>
                  <div className="font-medium text-warm-dark">{pt.reason}</div>
                  <div className="text-[10px] text-warm-subtle">{formatDate(pt.createdAt)}</div>
                </div>
              </div>
              <span
                className={`font-mono font-bold ${
                  pt.amount > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {pt.amount > 0 ? `+${pt.amount}` : pt.amount} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
