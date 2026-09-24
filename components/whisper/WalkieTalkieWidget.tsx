"use client";

import React, { useEffect, useState } from "react";
import { getLatestVoiceWhisper, VoiceWhisperItem } from "@/actions/whisper";
import { WalkieTalkieModal } from "./WalkieTalkieModal";
import { triggerHaptic } from "@/lib/haptics";

interface WalkieTalkieWidgetProps {
  partnerName?: string;
}

export function WalkieTalkieWidget({
  partnerName = "Partner",
}: WalkieTalkieWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [whisper, setWhisper] = useState<VoiceWhisperItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchWhisper = async () => {
    try {
      const res = await getLatestVoiceWhisper();
      if (res.success) {
        setWhisper(res.whisper);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Suppress background poll errors
    }
  };

  useEffect(() => {
    fetchWhisper();
    const interval = setInterval(fetchWhisper, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    triggerHaptic("selection");
    setModalOpen(true);
  };

  const hasUnread = Boolean(whisper && !whisper.isListened);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full p-2.5 sm:p-3 rounded-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.98] border select-none ${
          hasUnread
            ? "bg-gradient-to-r from-[#FFF0F3] to-[#FFE4E8] border-[#FF8A96] shadow-[0_0_18px_rgba(255,75,114,0.22)] animate-pulse"
            : "bg-white hover:bg-[#FAF7F2] border-[#EAE6DE] shadow-2xs hover:border-[#E06D75]/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-colors ${
                hasUnread
                  ? "bg-[#FF4B72] text-white shadow-xs"
                  : "bg-[#FAF7F2] border border-[#EAE6DE] text-[#1E1A18]"
              }`}
            >
              📻
            </span>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF4B72] border-2 border-white animate-ping" />
            )}
          </div>

          <div className="text-left min-w-0 flex-1">
            <div className="text-xs font-bold text-[#1E1A18] truncate">
              {hasUnread ? "New Whisper!" : "Walkie-Talkie"}
            </div>
            <div className="text-[10px] text-[#756963] truncate">
              {hasUnread
                ? `${whisper?.durationSec}s from ${partnerName}`
                : "Hold to whisper"}
            </div>
          </div>
        </div>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors ml-1 ${
            hasUnread
              ? "bg-[#FF4B72] text-white"
              : "bg-[#FAF7F2] text-[#756963]"
          }`}
        >
          {hasUnread ? "▶ Listen" : "🎙️"}
        </span>
      </button>

      <WalkieTalkieModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          fetchWhisper();
        }}
        partnerName={partnerName}
        initialWhisper={whisper}
        onWhisperSent={fetchWhisper}
      />
    </>
  );
}
