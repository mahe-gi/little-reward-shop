"use client";

import React from "react";
import { logoutAction } from "@/actions/auth";
import { User, Heart, LogOut } from "lucide-react";

interface HerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  userName?: string;
  partnerName?: string;
}

export function HerProfileModal({
  isOpen,
  onClose,
  points,
  userName = "Her",
  partnerName = "Mahesh",
}: HerProfileModalProps) {
  if (!isOpen) return null;

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-warm-border text-center">
        <div className="w-16 h-16 rounded-full bg-romantic-100 border border-romantic-200 text-romantic-600 flex items-center justify-center mx-auto mb-3 animate-heart">
          <User className="w-8 h-8 text-romantic-500" />
        </div>
        <h3 className="font-serif text-xl font-bold text-warm-dark flex items-center justify-center gap-1.5">
          <span>{userName}&apos;s Profile</span>
          <Heart className="w-4 h-4 fill-romantic-500 text-romantic-500" />
        </h3>
        <p className="text-xs text-warm-subtle mt-0.5">Your Little Reward Shop</p>

        <div className="my-4 p-3.5 bg-warm-muted rounded-2xl text-left text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-warm-subtle">Points Available:</span>
            <span className="font-bold text-romantic-600 font-serif text-base">{points} pts</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-subtle">App Role:</span>
            <span className="font-semibold text-warm-dark">Girlfriend</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-subtle">Fulfillment Manager:</span>
            <span className="font-semibold text-warm-dark">{partnerName}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-warm-muted hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-4 text-[10px] text-warm-subtle flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-romantic-400 fill-romantic-300" />
          <span>Encrypted with love & pinky promises</span>
        </div>
      </div>
    </div>
  );
}
