"use client";

import React, { useState } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { giveBonus, deductPoints } from "@/actions/wallet";

export interface PointsAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
  isSelf: boolean;
  currentBalance: number;
  initialMode?: "add" | "remove";
  onSuccess: (mode: "add" | "remove", amount: number) => void;
}

export function PointsAdjustModal({
  isOpen,
  onClose,
  targetUserId,
  targetName,
  isSelf,
  currentBalance,
  initialMode = "add",
  onSuccess,
}: PointsAdjustModalProps) {
  const [mode, setMode] = useState<"add" | "remove">(initialMode);
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode whenever initialMode changes or modal reopens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const isRemove = mode === "remove";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRemove && amount > currentBalance) {
      setError(`Cannot remove ${amount} pts. Current balance is only ${currentBalance} pts.`);
      setLoading(false);
      return;
    }

    const res = isRemove
      ? await deductPoints(targetUserId, amount, message)
      : await giveBonus(targetUserId, amount, message);

    setLoading(false);

    if (res.success) {
      onSuccess(mode, amount);
      setMessage("");
      setAmount(5);
      onClose();
    } else {
      setError(res.error || `Failed to ${isRemove ? "remove" : "give"} points`);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        isSelf
          ? isRemove
            ? "Adjust My Points"
            : "Add Points to Myself"
          : isRemove
          ? `Deduct from ${targetName}`
          : `Send ${targetName} Points`
      }
      subtitle={
        isRemove
          ? `Current balance: ${currentBalance} pts`
          : isSelf
          ? "Reward your effort and self-love."
          : "A sweet surprise to brighten their day."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Add vs Remove Segmented Switcher */}
        <div className="p-1 bg-[#F5F2EB] rounded-2xl flex text-xs font-semibold border border-[#EAE6DE]">
          <button
            type="button"
            onClick={() => {
              setMode("add");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              mode === "add"
                ? "bg-white text-[#24201D] shadow-xs"
                : "text-[#756963] hover:text-[#24201D]"
            }`}
          >
            + Add Points
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("remove");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              mode === "remove"
                ? "bg-white text-red-600 shadow-xs"
                : "text-[#756963] hover:text-[#24201D]"
            }`}
          >
            − Remove Points
          </button>
        </div>

        {/* Quick point chips */}
        <div>
          <label className="block font-semibold text-[#24201D] mb-1.5">
            {isRemove ? "Amount to Deduct" : "Select Amount"}
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[2, 5, 10, 20].map((pts) => {
              const selected = amount === pts;
              return (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setAmount(pts)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selected
                      ? isRemove
                        ? "bg-red-50 border border-red-300 text-red-700 shadow-sm"
                        : "bg-[#FCEBEE] border border-[#E06D75] text-[#AB3B46] shadow-sm"
                      : "bg-[#FAF7F2] border border-[#EAE6DE] text-[#756963] hover:border-[#E06D75]"
                  }`}
                >
                  {isRemove ? `−${pts} pts` : `+${pts} pts`}
                </button>
              );
            })}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmount((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] text-[#24201D] font-bold text-base flex items-center justify-center hover:border-[#E06D75] transition-all"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={isRemove ? Math.max(1, currentBalance) : 100}
              value={amount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) {
                  setAmount(isRemove ? Math.min(currentBalance, v) : Math.min(100, v));
                }
              }}
              className="flex-1 text-center px-2 py-2 bg-white border border-[#EAE6DE] rounded-xl text-sm font-bold text-[#24201D] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
            />
            <button
              type="button"
              onClick={() => setAmount((p) => (isRemove ? Math.min(currentBalance, p + 1) : Math.min(100, p + 1)))}
              className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] text-[#24201D] font-bold text-base flex items-center justify-center hover:border-[#E06D75] transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Optional note */}
        <div>
          <label className="block font-semibold text-[#24201D] mb-1">
            {isRemove ? "Reason (Optional)" : "Small Note (Optional)"}
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isRemove
                ? "e.g. Correcting point balance / penalty"
                : isSelf
                ? "e.g. Proud of my discipline today"
                : "e.g. You did amazing today"
            }
            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6DE] rounded-xl text-xs text-[#24201D] placeholder-[#A89F99] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
          />
        </div>

        <PillButton
          type="submit"
          variant={isRemove ? "secondary" : "primary"}
          size="lg"
          className={`w-full mt-2 font-bold ${isRemove ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" : ""}`}
          loading={loading}
        >
          {isRemove
            ? `Deduct ${amount} pts from ${isSelf ? "Myself" : targetName}`
            : isSelf
            ? `Add ${amount} pts to Myself`
            : `Send ${amount} pts to ${targetName}`}
        </PillButton>
      </form>
    </ModalSheet>
  );
}
