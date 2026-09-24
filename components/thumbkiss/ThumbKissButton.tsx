"use client";

import React, { useEffect, useState } from "react";
import { getPartnerThumbKissWaiting } from "@/actions/thumbkiss";
import { ThumbKissModal } from "./ThumbKissModal";
import { triggerHaptic } from "@/lib/haptics";

interface ThumbKissButtonProps {
  partnerName?: string;
  variant?: "banner" | "pill";
}

export function ThumbKissButton({
  partnerName = "Partner",
  variant = "banner",
}: ThumbKissButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [partnerWaiting, setPartnerWaiting] = useState(false);

  // Periodic polling to check if partner is currently waiting on the ThumbKiss screen
  useEffect(() => {
    let mounted = true;

    const checkWaiting = async () => {
      try {
        const res = await getPartnerThumbKissWaiting();
        if (mounted) {
          setPartnerWaiting(res.waiting);
        }
      } catch {
        // Suppress background poll errors
      }
    };

    checkWaiting();
    const interval = setInterval(checkWaiting, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpen = () => {
    triggerHaptic("medium");
    setModalOpen(true);
  };

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-xs ${
            partnerWaiting
              ? "bg-gradient-to-r from-[#FF4B72] to-[#E06D75] text-white shadow-[0_0_16px_rgba(255,75,114,0.4)] animate-pulse"
              : "bg-[#FCEBEE] text-[#AB3B46] hover:bg-[#FAD4DA] border border-[#FAD4DA]"
          }`}
        >
          <span className="text-sm">💋</span>
          <span>{partnerWaiting ? `${partnerName} is waiting!` : "ThumbKiss"}</span>
        </button>

        <ThumbKissModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          partnerName={partnerName}
        />
      </>
    );
  }

  // Default "banner" widget
  return (
    <>
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpen();
        }}
        className={`relative overflow-hidden rounded-3xl p-4 cursor-pointer transition-all duration-300 select-none active:scale-[0.99] border ${
          partnerWaiting
            ? "bg-gradient-to-br from-[#FFF0F3] via-[#FFE4E8] to-[#FFD8DF] border-[#FF8A96] shadow-[0_8px_25px_rgba(255,75,114,0.22)] ring-2 ring-[#FF4B72]/40"
            : "bg-white hover:bg-[#FAF7F2] border-[#EAE6DE] shadow-xs hover:border-[#E06D75]/40"
        }`}
      >
        {/* Subtle decorative glow */}
        {partnerWaiting && (
          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-[#FF4B72]/20 blur-xl pointer-events-none" />
        )}

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Visual Icon / Avatar */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-all ${
                partnerWaiting
                  ? "bg-[#FF4B72] text-white shadow-md animate-bounce"
                  : "bg-[#FCEBEE] text-[#AB3B46]"
              }`}
            >
              💋
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1E1A18] tracking-tight">
                  ThumbKiss
                </span>
                {partnerWaiting ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF4B72] text-white text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Waiting now!
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[#756963] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#EAE6DE]">
                    Live Touch
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#756963] truncate mt-0.5">
                {partnerWaiting
                  ? `💖 ${partnerName} has their finger on screen!`
                  : "Touch the screen together & feel the heartbeat"}
              </p>
            </div>
          </div>

          {/* Action Pill */}
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-xs ${
              partnerWaiting
                ? "bg-[#FF4B72] text-white hover:bg-[#E03B61]"
                : "bg-[#FCEBEE] text-[#AB3B46] hover:bg-[#E06D75] hover:text-white"
            }`}
          >
            {partnerWaiting ? "Touch Now →" : "Touch →"}
          </button>
        </div>
      </div>

      <ThumbKissModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerName={partnerName}
      />
    </>
  );
}
