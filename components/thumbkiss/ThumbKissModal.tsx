"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  pingThumbKiss,
  getPartnerThumbKissWaiting,
  resetThumbKiss,
} from "@/actions/thumbkiss";
import { triggerHaptic } from "@/lib/haptics";

interface ThumbKissModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
}

export function ThumbKissModal({
  isOpen,
  onClose,
  partnerName,
}: ThumbKissModalProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [partnerTouching, setPartnerTouching] = useState(false);

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idlePollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  isHoldingRef.current = isHolding;

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;
    triggerHaptic("heartbeat");
    heartbeatIntervalRef.current = setInterval(() => {
      triggerHaptic("heartbeat");
    }, 950);
  }, []);

  const stopPinging = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const handleRelease = useCallback(async () => {
    setIsHolding(false);
    setIsMatched(false);
    stopPinging();
    stopHeartbeat();
    await pingThumbKiss(false);
  }, [stopPinging, stopHeartbeat]);

  const handlePressStart = useCallback(
    async (e: React.TouchEvent | React.MouseEvent) => {
      if ("touches" in e && e.cancelable) {
        e.preventDefault();
      }

      setIsHolding(true);
      triggerHaptic("medium");

      const initialRes = await pingThumbKiss(true);
      if (initialRes.success) {
        setPartnerTouching(initialRes.partnerTouching);
        if (initialRes.matched) {
          setIsMatched(true);
          triggerHaptic("sparkUnlock");
          startHeartbeat();
        }
      }

      stopPinging();
      pingIntervalRef.current = setInterval(async () => {
        if (!isHoldingRef.current) return;
        const res = await pingThumbKiss(true);
        if (res.success) {
          setPartnerTouching(res.partnerTouching);
          if (res.matched) {
            setIsMatched(true);
            startHeartbeat();
          } else {
            setIsMatched(false);
            stopHeartbeat();
          }
        }
      }, 750);
    },
    [stopPinging, startHeartbeat, stopHeartbeat]
  );

  // Poll partner waiting state when idle
  useEffect(() => {
    if (!isOpen || isHolding) {
      if (idlePollIntervalRef.current) {
        clearInterval(idlePollIntervalRef.current);
        idlePollIntervalRef.current = null;
      }
      return;
    }

    const checkIdle = async () => {
      const res = await getPartnerThumbKissWaiting();
      setPartnerTouching(res.waiting);
    };

    checkIdle();
    idlePollIntervalRef.current = setInterval(checkIdle, 1800);

    return () => {
      if (idlePollIntervalRef.current) {
        clearInterval(idlePollIntervalRef.current);
        idlePollIntervalRef.current = null;
      }
    };
  }, [isOpen, isHolding]);

  // Teardown
  useEffect(() => {
    if (!isOpen) {
      setIsHolding(false);
      setIsMatched(false);
      stopPinging();
      stopHeartbeat();
      resetThumbKiss();
    }

    return () => {
      stopPinging();
      stopHeartbeat();
      resetThumbKiss();
    };
  }, [isOpen, stopPinging, stopHeartbeat]);

  // Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between items-center select-none overflow-hidden touch-none"
      style={{
        backgroundColor: "#0D0407",
      }}
      onTouchStart={handlePressStart}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
      onMouseDown={handlePressStart}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Soft Ambient Radial Light */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
          isMatched
            ? "opacity-100 scale-110"
            : isHolding
            ? "opacity-60 scale-100"
            : "opacity-30 scale-95"
        }`}
        style={{
          background: isMatched
            ? "radial-gradient(circle at center, rgba(255, 75, 114, 0.35) 0%, rgba(180, 58, 71, 0.15) 45%, transparent 75%)"
            : "radial-gradient(circle at center, rgba(224, 109, 117, 0.22) 0%, transparent 65%)",
        }}
      />

      {/* Top Bar */}
      <header className="relative z-20 w-full max-w-md px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Intimate Touch
          </span>
          <h2 className="font-serif text-lg font-bold text-white tracking-tight">
            Touch Screen Together
          </h2>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRelease();
            onClose();
          }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-md"
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      {/* Center Heart Target */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto pointer-events-none">
        {/* Expanding Shockwave Waves when Matched */}
        {isMatched && (
          <>
            <div className="absolute w-64 h-64 rounded-full border border-[#FF4B72]/40 animate-ripple" />
            <div className="absolute w-64 h-64 rounded-full border border-[#FF7E99]/30 animate-ripple-delayed" />
          </>
        )}

        {/* Breathing aura when holding */}
        {isHolding && !isMatched && (
          <div className="absolute w-56 h-56 rounded-full border border-white/15 animate-ping opacity-40" />
        )}

        {/* Main Minimalist Heart */}
        <div
          className={`relative transition-all duration-300 flex items-center justify-center ${
            isMatched
              ? "scale-125 animate-heartbeat"
              : isHolding
              ? "scale-110"
              : partnerTouching
              ? "scale-105 animate-pulse"
              : "scale-100"
          }`}
        >
          <svg
            width="140"
            height="140"
            viewBox="0 0 24 24"
            fill={isMatched ? "#FF4B72" : isHolding ? "#E06D75" : "#FFFFFF"}
            className={`transition-colors duration-300 drop-shadow-[0_0_35px_rgba(224,109,117,0.45)] ${
              !isHolding && !partnerTouching ? "opacity-75" : "opacity-100"
            }`}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        {/* Single Clean Status Line */}
        <div className="mt-8 text-center transition-all duration-300">
          <p
            className={`text-sm tracking-wide font-medium ${
              isMatched
                ? "text-white font-semibold"
                : isHolding
                ? "text-white/85"
                : partnerTouching
                ? "text-[#FF8A96] font-semibold"
                : "text-white/60"
            }`}
          >
            {isMatched
              ? `Connected with ${partnerName}`
              : isHolding
              ? `Waiting for ${partnerName} to touch...`
              : partnerTouching
              ? `${partnerName} is holding their screen! Hold now`
              : "Hold your finger anywhere on screen"}
          </p>
        </div>
      </div>

      {/* Clean Minimalist Bottom Footer */}
      <footer className="relative z-20 w-full max-w-sm px-6 pb-10 text-center pointer-events-none">
        <p className="text-[11px] text-white/40 tracking-wider">
          Both phones vibrate together when synchronized
        </p>
      </footer>
    </div>
  );
}
