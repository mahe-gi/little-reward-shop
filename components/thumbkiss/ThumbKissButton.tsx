"use client";

import React, { useEffect, useState } from "react";
import { getPartnerThumbKissWaiting } from "@/actions/thumbkiss";
import { ThumbKissModal } from "./ThumbKissModal";
import { triggerHaptic } from "@/lib/haptics";

interface ThumbKissButtonProps {
  partnerName?: string;
}

export function ThumbKissButton({
  partnerName = "Partner",
}: ThumbKissButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [partnerWaiting, setPartnerWaiting] = useState(false);

  // Periodic polling to check if partner is currently holding screen
  useEffect(() => {
    let mounted = true;

    const checkWaiting = async () => {
      try {
        const res = await getPartnerThumbKissWaiting();
        if (mounted) {
          setPartnerWaiting(res.waiting);
        }
      } catch {
        // Fail silently
      }
    };

    checkWaiting();
    const interval = setInterval(checkWaiting, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpen = () => {
    triggerHaptic("selection");
    setModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.99] border select-none ${
          partnerWaiting
            ? "bg-gradient-to-r from-[#FFF0F3] to-[#FFE4E8] border-[#FF8A96] shadow-[0_0_18px_rgba(255,75,114,0.25)] animate-pulse"
            : "bg-white hover:bg-[#FAF7F2] border-[#EAE6DE] shadow-2xs hover:border-[#E06D75]/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
              partnerWaiting
                ? "bg-[#FF4B72] text-white"
                : "bg-[#FCEBEE] text-[#AB3B46]"
            }`}
          >
            ♥
          </span>
          <div className="text-left">
            <div className="text-xs font-bold text-[#1E1A18] tracking-tight">
              {partnerWaiting
                ? `${partnerName} is touching screen!`
                : "Touch Screen Together"}
            </div>
            <div className="text-[10px] text-[#756963]">
              {partnerWaiting
                ? "Tap to sync heartbeats now"
                : "Hold fingers together to feel each other"}
            </div>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors ${
            partnerWaiting
              ? "bg-[#FF4B72] text-white"
              : "bg-[#FCEBEE] text-[#AB3B46]"
          }`}
        >
          {partnerWaiting ? "Touch ♥" : "Open"}
        </span>
      </button>

      <ThumbKissModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerName={partnerName}
      />
    </>
  );
}
