"use client";

import React, { useState, useEffect } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import {
  NudgeItem,
  NudgeType,
  sendNudge,
  getNudges,
  markNudgesAsSeen,
} from "@/actions/nudges";

export interface WhispersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string;
  onNudgeSent?: (message: string) => void;
}

const QUICK_NUDGES: { type: NudgeType; emoji: string; label: string; desc: string }[] = [
  { type: "HEARTBEAT", emoji: "💓", label: "Heartbeat", desc: "Send a pulse" },
  { type: "KISS", emoji: "💋", label: "Kiss", desc: "Sweet kiss" },
  { type: "HUG", emoji: "🤗", label: "Warm Hug", desc: "Cozy embrace" },
  { type: "MISS_YOU", emoji: "☕", label: "Thinking of You", desc: "Sweet check-in" },
];

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WhispersSheet({
  isOpen,
  onClose,
  partnerName = "Partner",
  onNudgeSent,
}: WhispersSheetProps) {
  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingType, setSendingType] = useState<NudgeType | null>(null);
  const [customWhisper, setCustomWhisper] = useState("");
  const [sendingCustom, setSendingCustom] = useState(false);

  // Load nudges on open
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    getNudges()
      .then((res) => {
        if (res.success && res.data) {
          setNudges(res.data);
        }
      })
      .finally(() => setLoading(false));

    markNudgesAsSeen().catch(() => {});
  }, [isOpen]);

  const handleSendQuickNudge = async (type: NudgeType) => {
    if (sendingType) return;
    setSendingType(type);

    try {
      const res = await sendNudge(type);
      if (res.success && res.nudge) {
        setNudges((prev) => [res.nudge!, ...prev]);
        onNudgeSent?.(`Sent ${type.toLowerCase()} to ${partnerName}`);

        // Light haptic tap
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(60);
        }
      }
    } finally {
      setSendingType(null);
    }
  };

  const handleSendCustomWhisper = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = customWhisper.trim();
    if (!text || sendingCustom) return;

    setSendingCustom(true);
    try {
      const res = await sendNudge("WHISPER", text);
      if (res.success && res.nudge) {
        setNudges((prev) => [res.nudge!, ...prev]);
        setCustomWhisper("");
        onNudgeSent?.(`Whispered to ${partnerName}`);

        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(60);
        }
      }
    } finally {
      setSendingCustom(false);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Whispers & Nudges"
      subtitle={`Instant love signals & private notes for ${partnerName}`}
    >
      <div className="space-y-4 py-1">
        {/* Quick Haptic Nudge Chips */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963] px-1 mb-2">
            Send an Instant Signal
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_NUDGES.map((item) => {
              const isSending = sendingType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  disabled={Boolean(sendingType)}
                  onClick={() => handleSendQuickNudge(item.type)}
                  className={`p-3 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs hover:border-[#E06D75]/40 hover:bg-[#FFFDF9] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 group cursor-pointer ${
                    isSending ? "scale-95 ring-2 ring-[#E06D75]" : ""
                  }`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {item.emoji}
                  </span>
                  <span className="font-bold text-xs text-[#1E1A18]">{item.label}</span>
                  <span className="text-[10px] text-[#756963] leading-none">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Sweet Whisper Composer */}
        <form onSubmit={handleSendCustomWhisper} className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963] px-1">
            Send a Sweet Whisper
          </div>
          <div className="relative">
            <input
              type="text"
              value={customWhisper}
              maxLength={140}
              onChange={(e) => setCustomWhisper(e.target.value)}
              placeholder={`Send a secret whisper to ${partnerName}... 💌`}
              className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-[#EAE6DE] rounded-2xl text-xs text-[#1E1A18] placeholder:text-[#A89F99] focus:outline-hidden focus:border-[#E06D75] focus:ring-1 focus:ring-[#E06D75] shadow-2xs transition-all"
            />
            <button
              type="submit"
              disabled={!customWhisper.trim() || sendingCustom}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1E1A18] text-white rounded-xl text-[11px] font-bold hover:bg-[#E06D75] transition-colors disabled:opacity-40 disabled:hover:bg-[#1E1A18] cursor-pointer"
            >
              {sendingCustom ? "..." : "Send"}
            </button>
          </div>
        </form>

        {/* Whispers Feed / Timeline */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963] px-1 flex items-center justify-between">
            <span>Recent Whispers</span>
            <span className="text-[10px] text-[#A89F99] font-normal">Private between you two</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#756963]">
                Loading whispers...
              </div>
            ) : nudges.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-[#EAE6DE] space-y-1 p-4">
                <span className="text-2xl">💌</span>
                <p className="text-xs font-bold text-[#1E1A18]">No whispers yet</p>
                <p className="text-[11px] text-[#756963]">
                  Tap one of the buttons above to send your first love signal!
                </p>
              </div>
            ) : (
              nudges.map((item) => {
                const isMine = item.isFromMe;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-2xs border transition-all ${
                        isMine
                          ? "bg-gradient-to-r from-[#FFF5F6] to-[#FFFBF0] border-[#FEF3D6] text-[#1E1A18] rounded-br-xs"
                          : "bg-white border-[#EAE6DE] text-[#1E1A18] rounded-bl-xs"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                        <span>
                          {item.type === "HEARTBEAT" && "💓"}
                          {item.type === "KISS" && "💋"}
                          {item.type === "HUG" && "🤗"}
                          {item.type === "MISS_YOU" && "☕"}
                          {item.type === "WHISPER" && "💌"}
                        </span>
                        <span className="text-[#AB3B46]">
                          {item.type === "HEARTBEAT" && "Heartbeat"}
                          {item.type === "KISS" && "Kiss"}
                          {item.type === "HUG" && "Warm Hug"}
                          {item.type === "MISS_YOU" && "Thinking of you"}
                          {item.type === "WHISPER" && "Whisper"}
                        </span>
                      </div>

                      {item.message && (
                        <p className="text-xs text-[#3C2D28] leading-relaxed italic">
                          &ldquo;{item.message}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#A89F99] mt-1">
                        <span>{formatTime(item.createdAt)}</span>
                        {isMine && (
                          <span>
                            {item.seenAt ? (
                              <span className="text-[#557567] font-semibold">Seen ✓</span>
                            ) : (
                              <span>Sent</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ModalSheet>
  );
}
