"use client";

import React, { useState } from "react";
import { WhispersSheet } from "./WhispersSheet";

export interface WhispersButtonProps {
  className?: string;
  partnerName?: string;
  onToast?: (message: string) => void;
}

export function WhispersButton({
  className = "",
  partnerName = "Partner",
  onToast,
}: WhispersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Whispers & Nudges"
        className={`relative w-9 h-9 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs hover:border-[#E06D75]/40 hover:bg-[#FFF5F6] flex items-center justify-center text-[#E06D75] transition-all active:scale-90 cursor-pointer group ${className}`}
      >
        <span className="text-base group-hover:scale-115 transition-transform">
          💌
        </span>
      </button>

      <WhispersSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        partnerName={partnerName}
        onNudgeSent={onToast}
      />
    </>
  );
}
