"use client";

import React, { useEffect, useState } from "react";
import { NudgeItem, markNudgesAsSeen } from "@/actions/nudges";
import { Avatar } from "@/components/ui/Avatar";

export interface LiveNudgeOverlayProps {
  nudge: NudgeItem | null;
  onDismiss: () => void;
  onOpenWhispers?: () => void;
}

export function LiveNudgeOverlay({
  nudge,
  onDismiss,
  onOpenWhispers,
}: LiveNudgeOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!nudge) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Haptic vibration feedback on supported phones
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {
        // Safe fallback
      }
    }

    // Auto-mark as seen and auto-dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      markNudgesAsSeen().catch(() => {});
      setTimeout(onDismiss, 400);
    }, 4500);

    return () => clearTimeout(timer);
  }, [nudge, onDismiss]);

  if (!nudge || !visible) return null;

  const handleClick = () => {
    setVisible(false);
    markNudgesAsSeen().catch(() => {});
    onDismiss();
    onOpenWhispers?.();
  };

  const isHeart = nudge.type === "HEARTBEAT";
  const isKiss = nudge.type === "KISS";
  const isHug = nudge.type === "HUG";
  const isMissYou = nudge.type === "MISS_YOU";
  const isWhisper = nudge.type === "WHISPER";

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 z-50 pointer-events-auto flex flex-col items-center justify-center p-4 bg-black/30 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
    >
      {/* Floating Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Heart / Kiss particles */}
        <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce duration-1000 opacity-80">
          {isHeart ? "💓" : isKiss ? "💋" : isHug ? "🤗" : isMissYou ? "✨" : "💌"}
        </div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-pulse duration-700 opacity-90 delay-150">
          {isHeart ? "💖" : isKiss ? "✨" : isHug ? "🌸" : isMissYou ? "☕" : "🤍"}
        </div>
        <div className="absolute bottom-1/3 left-1/3 text-4xl animate-bounce duration-800 opacity-75 delay-300">
          {isHeart ? "💗" : isKiss ? "💋" : isHug ? "🫂" : isMissYou ? "🌙" : "✨"}
        </div>
        <div className="absolute bottom-1/4 right-1/3 text-3xl animate-pulse duration-1000 opacity-70 delay-500">
          {isHeart ? "💝" : isKiss ? "💕" : isHug ? "💛" : isMissYou ? "⭐" : "💌"}
        </div>
      </div>

      {/* Center Nudge Card */}
      <div
        className="relative z-10 w-full max-w-xs bg-linear-to-b from-[#FFFDF9] to-[#FAF7F2] p-5 rounded-[28px] border border-[#FEF3D6] shadow-[0_20px_60px_-15px_rgba(224,109,117,0.35)] text-center space-y-3 cursor-pointer select-none active:scale-95 transition-all transform animate-in zoom-in-95 duration-200"
      >
        {/* Floating Pulse Rings */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#E06D75]/20 animate-ping duration-1000" />
          <div className="absolute inset-1 rounded-full bg-[#E06D75]/15 animate-pulse" />
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-center text-3xl">
            {isHeart && "💓"}
            {isKiss && "💋"}
            {isHug && "🤗"}
            {isMissYou && "☕"}
            {isWhisper && "💌"}
          </div>
        </div>

        {/* Sender & Text */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#756963]">
            <Avatar
              avatar={nudge.senderAvatar}
              name={nudge.senderName}
              size="sm"
              fallback="👤"
              className="w-4 h-4 rounded-full"
            />
            <span className="font-bold text-[#1E1A18]">{nudge.senderName}</span>
            <span>sent you a</span>
          </div>

          <h3 className="font-serif text-lg font-bold text-[#1E1A18] tracking-tight">
            {isHeart && "Heartbeat Pulse"}
            {isKiss && "Sweet Kiss"}
            {isHug && "Warm Embrace"}
            {isMissYou && "Thinking of You"}
            {isWhisper && "Private Whisper"}
          </h3>

          {nudge.message && (
            <p className="text-xs text-[#4A3E39] bg-white/80 p-2.5 rounded-2xl border border-[#EAE6DE]/70 italic mt-1 leading-relaxed shadow-2xs">
              &ldquo;{nudge.message}&rdquo;
            </p>
          )}
        </div>

        {/* Bottom CTA hint */}
        <div className="pt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-[#E06D75]">
          <span>Tap to whisper back</span>
          <span>›</span>
        </div>
      </div>
    </div>
  );
}
