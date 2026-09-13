"use client";

import React, { useState } from "react";
import { CartItem } from "@/types";
import { PrettyIcon } from "@/components/shared/PrettyIcon";
import { ShoppingBag, AlertCircle, Heart, X, Sparkles } from "lucide-react";

interface HerCartProps {
  cart: CartItem[];
  availablePoints: number;
  onUpdateQuantity: (rewardId: string, delta: number) => void;
  onRemoveItem: (rewardId: string) => void;
  onExploreRewards: () => void;
  onSubmitRedemption: (note: string) => void;
}

export function HerCart({
  cart,
  availablePoints,
  onUpdateQuantity,
  onRemoveItem,
  onExploreRewards,
  onSubmitRedemption,
}: HerCartProps) {
  const [note, setNote] = useState("");

  const totalPoints = cart.reduce((sum, item) => sum + item.points * item.quantity, 0);
  const remainingPoints = availablePoints - totalPoints;
  const isInsufficient = totalPoints > availablePoints;
  const shortage = totalPoints - availablePoints;

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-16 h-16 rounded-full bg-warm-muted flex items-center justify-center text-3xl mb-3 animate-heart">
          <ShoppingBag className="w-8 h-8 text-romantic-400" />
        </div>
        <h4 className="font-serif text-lg font-bold text-warm-dark">
          Your cart is feeling lonely
        </h4>
        <p className="text-xs text-warm-subtle mt-1 max-w-[220px]">
          You have earned points ready to be turned into sweet memories.
        </p>
        <button
          onClick={onExploreRewards}
          className="mt-4 px-4 py-2 bg-romantic-500 hover:bg-romantic-600 text-white rounded-xl text-xs font-semibold shadow-soft transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Find a Reward</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-20 pt-3">
      {/* Header */}
      <div className="px-5 mb-3">
        <h2 className="font-serif text-2xl font-bold text-warm-dark">Your Rewards</h2>
        <p className="text-xs text-warm-subtle">
          Review the rewards you want Mahesh to fulfill.
        </p>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-2.5 hide-scrollbar">
        {cart.map((item) => (
          <div
            key={item.rewardId}
            className="p-3.5 rounded-2xl bg-white border border-warm-border shadow-soft flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-warm-muted flex items-center justify-center shrink-0">
                <PrettyIcon name={item.emoji} className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-warm-dark">{item.title}</div>
                <div className="text-[11px] text-romantic-600 font-semibold">
                  {item.points} {item.points === 1 ? "point" : "points"} each
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-warm-border rounded-lg bg-warm-muted overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(item.rewardId, -1)}
                  className="px-2 py-0.5 text-xs font-bold text-warm-dark hover:bg-warm-border active:scale-95 transition-colors"
                >
                  -
                </button>
                <span className="px-2 py-0.5 text-xs font-bold text-warm-dark">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.rewardId, 1)}
                  className="px-2 py-0.5 text-xs font-bold text-warm-dark hover:bg-warm-border active:scale-95 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRemoveItem(item.rewardId)}
                className="text-stone-400 hover:text-rose-500 p-1.5 transition-colors rounded-lg hover:bg-rose-50"
                title="Remove item"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Optional note input */}
        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-warm-subtle mb-1">
            Note for Mahesh (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you want Mahesh to know?"
            className="w-full px-3 py-2 text-xs bg-white border border-warm-border rounded-xl focus:outline-none focus:ring-2 focus:ring-romantic-400 text-warm-dark placeholder:text-warm-taupe"
          />
        </div>
      </div>

      {/* Insufficient points alert banner */}
      {isInsufficient && (
        <div className="mx-5 my-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="font-bold text-rose-800">You&apos;re {shortage} points short</div>
            <div className="text-[11px] text-rose-600">
              Need {shortage} more points for this wishlist
            </div>
          </div>
        </div>
      )}

      {/* Sticky Cart Summary */}
      <div className="p-5 bg-white border-t border-warm-border shadow-lg rounded-t-3xl">
        <div className="space-y-1.5 text-xs text-warm-subtle mb-3">
          <div className="flex justify-between">
            <span>Total Points Needed</span>
            <span className="font-bold text-warm-dark text-sm">{totalPoints} points</span>
          </div>
          <div className="flex justify-between">
            <span>Available Balance</span>
            <span className="font-semibold text-warm-dark">{availablePoints} points</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-warm-border">
            <span className="font-medium text-warm-dark">Remaining after redeem</span>
            <span className="font-bold text-romantic-600">
              {remainingPoints >= 0 ? remainingPoints : 0} points
            </span>
          </div>
        </div>

        {isInsufficient ? (
          <button
            disabled
            className="w-full py-3.5 rounded-2xl bg-stone-200 text-stone-400 font-semibold text-sm cursor-not-allowed text-center"
          >
            Keep earning (Need {shortage} more)
          </button>
        ) : (
          <button
            onClick={() => onSubmitRedemption(note)}
            className="w-full py-3.5 rounded-2xl bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white text-white" />
            <span>Redeem Rewards</span>
          </button>
        )}

        <p className="text-[10px] text-center text-warm-subtle mt-2">
          Points are used only when your request is approved. Adding items does not immediately deduct points.
        </p>
      </div>
    </div>
  );
}
