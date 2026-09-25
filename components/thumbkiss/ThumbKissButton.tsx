"use client";

import React, { useEffect, useState } from "react";
import { getPartnerThumbKissWaiting } from "@/actions/thumbkiss";
import { ThumbKissModal } from "./ThumbKissModal";
import { triggerHaptic } from "@/lib/haptics";
import { HeartIcon } from "@/components/ui/Icons";

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
        className={`w-full p-2.5 sm:p-3 rounded-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.98] border select-none ${
          partnerWaiting
            ? "bg-gradient-to-r from-[#FFF0F3] to-[#FFE4E8] border-[#FF8A96] shadow-[0_0_18px_rgba(255,75,114,0.25)] animate-pulse"
            : "bg-white hover:bg-[#FAF7F2] border-[#EAE6DE] shadow-2xs hover:border-[#E06D75]/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-colors ${
                partnerWaiting
                  ? "bg-[#BA3F4A] text-white"
                  : "bg-[#FFF2F4] text-[#BA3F4A]"
              }`}
            >
              <HeartIcon size={14} filled className={partnerWaiting ? "text-white" : "text-[#BA3F4A]"} />
            </span>
            {partnerWaiting && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#BA3F4A] border-2 border-white animate-ping" />
            )}
          </div>

          <div className="text-left min-w-0 flex-1">
            <div className="text-xs font-bold text-[#1E1A18] truncate">
              {partnerWaiting
                ? `${partnerName} touching`
                : "Touch Screen"}
            </div>
            <div className="text-[10px] text-[#554B45] font-medium truncate">
              {partnerWaiting
                ? "Tap to sync heartbeat"
                : "Sync heartbeat"}
            </div>
          </div>
        </div>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors ml-1 ${
            partnerWaiting
              ? "bg-[#BA3F4A] text-white"
              : "bg-[#FAF7F2] text-[#554B45]"
          }`}
        >
          {partnerWaiting ? "Touch" : "Open"}
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
