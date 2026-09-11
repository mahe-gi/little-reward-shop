"use client";

import React from "react";
import { CartItem } from "@/types";

interface RedemptionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: CartItem[];
  totalPoints: number;
  remainingPoints: number;
  isSubmitting?: boolean;
}

export function RedemptionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  totalPoints,
  remainingPoints,
  isSubmitting = false,
}: RedemptionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-warm-border text-center">
        <div className="w-14 h-14 rounded-2xl bg-romantic-100 border border-romantic-200 text-romantic-600 text-2xl flex items-center justify-center mx-auto mb-3">
          👀
        </div>
        <h3 className="font-serif text-2xl font-bold text-warm-dark">Wait... 👀</h3>
        <p className="text-xs text-warm-subtle mt-1 px-3">
          You&apos;re about to spend{" "}
          <strong className="text-warm-dark font-bold">{totalPoints} points</strong> on these
          rewards:
        </p>

        <div className="my-3 p-3 bg-warm-muted rounded-2xl text-left text-xs space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
          {items.map((item) => (
            <div key={item.rewardId} className="flex items-center justify-between">
              <span className="text-warm-dark font-medium">
                {item.emoji} {item.title} {item.quantity > 1 ? `×${item.quantity}` : ""}
              </span>
              <span className="font-semibold text-romantic-600">
                {item.points * item.quantity} {item.points * item.quantity === 1 ? "pt" : "pts"}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-warm-border flex justify-between font-bold text-romantic-700">
            <span>Total: {totalPoints} pts</span>
            <span>{remainingPoints} pts remaining</span>
          </div>
        </div>

        <p className="text-[11px] text-warm-subtle italic mb-4">
          Remember: Points are deducted only after Mahesh approves!
        </p>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3 bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Sending Request..." : "Yes, Redeem ❤️"}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
          >
            Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}
