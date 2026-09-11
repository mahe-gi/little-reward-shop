"use client";

import React, { useState } from "react";
import { PointTransaction } from "@/types";
import { formatDate } from "@/lib/utils";

interface AdminPointsLedgerProps {
  points: number;
  history: PointTransaction[];
  onGivePoints: (amount: number, reason: string) => Promise<void>;
  onDeductPoints: (amount: number, reason: string) => Promise<void>;
}

export function AdminPointsLedger({
  points,
  history,
  onGivePoints,
  onDeductPoints,
}: AdminPointsLedgerProps) {
  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);

  const [giveAmount, setGiveAmount] = useState(1);
  const [giveReason, setGiveReason] = useState("Healthy habit verified");

  const [deductAmount, setDeductAmount] = useState(1);
  const [deductReason, setDeductReason] = useState("Manual adjustment");

  const [isLoading, setIsLoading] = useState(false);

  // Compute lifetime stats
  const lifetimeEarned = history
    .filter((pt) => pt.amount > 0)
    .reduce((sum, pt) => sum + pt.amount, 0);

  const lifetimeRedeemed = history
    .filter((pt) => pt.amount < 0)
    .reduce((sum, pt) => sum + Math.abs(pt.amount), 0);

  const handleGiveSubmit = async () => {
    setIsLoading(true);
    await onGivePoints(giveAmount, giveReason);
    setIsLoading(false);
    setIsGiveModalOpen(false);
  };

  const handleDeductSubmit = async () => {
    setIsLoading(true);
    await onDeductPoints(deductAmount, deductReason);
    setIsLoading(false);
    setIsDeductModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-warm-dark">Points Ledger</h2>
          <p className="text-xs text-warm-subtle">
            Manage balances, award points for good habits, or make adjustments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGiveModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            + Add Points
          </button>
          <button
            onClick={() => setIsDeductModalOpen(true)}
            className="px-3 py-2 bg-white border border-warm-border text-warm-subtle hover:text-rose-600 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            − Deduct
          </button>
        </div>
      </div>

      {/* Big Balance Banner */}
      <div className="p-6 rounded-3xl bg-white border border-warm-border shadow-soft flex items-center justify-between">
        <div>
          <div className="text-xs uppercase font-bold text-warm-subtle tracking-wider">
            Her Current Balance
          </div>
          <div className="text-5xl font-serif font-bold text-warm-dark mt-1">
            {points}{" "}
            <span className="text-base font-sans font-semibold text-romantic-600">Points</span>
          </div>
        </div>
        <div className="text-right text-xs text-warm-subtle">
          <div>
            Lifetime Earned: <strong className="text-warm-dark font-bold">{lifetimeEarned} pts</strong>
          </div>
          <div className="mt-1">
            Lifetime Redeemed:{" "}
            <strong className="text-warm-dark font-bold">{lifetimeRedeemed} pts</strong>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-warm-border shadow-soft overflow-hidden">
        <div className="p-4 border-b border-warm-border font-bold text-xs text-warm-dark flex justify-between items-center">
          <span>Transaction History</span>
          <span className="text-[11px] text-warm-subtle font-normal">
            {history.length} transactions recorded
          </span>
        </div>
        <div className="divide-y divide-warm-border text-xs">
          {history.map((tx) => (
            <div key={tx.id} className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                    tx.amount > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </span>
                <div>
                  <div className="font-bold text-warm-dark">{tx.reason}</div>
                  <div className="text-[11px] text-warm-subtle">
                    {formatDate(tx.createdAt)} · {tx.type}
                  </div>
                </div>
              </div>
              <span
                className={`font-mono font-bold ${
                  tx.amount > 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {tx.amount > 0 ? `+${tx.amount} pt` : `${tx.amount} pts`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: GIVE POINTS */}
      {isGiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-warm-border">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-serif text-xl font-bold text-warm-dark">Give Points to Her</h3>
            <p className="text-xs text-warm-subtle mt-0.5 mb-4">
              Reward her for being amazing or completing habits.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-warm-dark mb-1">
                  Points Amount
                </label>
                <input
                  type="number"
                  value={giveAmount}
                  onChange={(e) => setGiveAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={50}
                  className="w-full px-3 py-2 border border-warm-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-romantic-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-warm-dark mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={giveReason}
                  onChange={(e) => setGiveReason(e.target.value)}
                  placeholder="e.g. Completed morning walk"
                  className="w-full px-3 py-2 border border-warm-border rounded-xl focus:ring-2 focus:ring-romantic-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 mt-5">
              <button
                onClick={handleGiveSubmit}
                disabled={isLoading}
                className="w-full py-2.5 bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50"
              >
                {isLoading ? "Adding Points..." : "Add Points Now"}
              </button>
              <button
                onClick={() => setIsGiveModalOpen(false)}
                className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEDUCT POINTS */}
      {isDeductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-warm-border">
            <div className="text-2xl mb-2">🪙</div>
            <h3 className="font-serif text-xl font-bold text-warm-dark">Deduct Points</h3>
            <p className="text-xs text-warm-subtle mt-0.5 mb-4">
              Manual balance adjustment with reason required.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-warm-dark mb-1">
                  Amount to Deduct
                </label>
                <input
                  type="number"
                  value={deductAmount}
                  onChange={(e) =>
                    setDeductAmount(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min={1}
                  max={points}
                  className="w-full px-3 py-2 border border-warm-border rounded-xl font-bold text-sm focus:ring-2 focus:ring-romantic-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-warm-dark mb-1">Reason</label>
                <input
                  type="text"
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="e.g. Balance correction"
                  className="w-full px-3 py-2 border border-warm-border rounded-xl focus:ring-2 focus:ring-romantic-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 mt-5">
              <button
                onClick={handleDeductSubmit}
                disabled={isLoading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50"
              >
                {isLoading ? "Deducting..." : "Confirm Deduction"}
              </button>
              <button
                onClick={() => setIsDeductModalOpen(false)}
                className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
