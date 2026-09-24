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

  // Sync ref with state for event listeners
  isHoldingRef.current = isHolding;

  // Stop heartbeat vibration loop
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Start heartbeat vibration loop
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;
    // Immediate initial heartbeat
    triggerHaptic("heartbeat");
    heartbeatIntervalRef.current = setInterval(() => {
      triggerHaptic("heartbeat");
    }, 950);
  }, []);

  // Stop active ping loop
  const stopPinging = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Release touch state cleanly
  const handleRelease = useCallback(async () => {
    setIsHolding(false);
    setIsMatched(false);
    stopPinging();
    stopHeartbeat();
    await pingThumbKiss(false);
  }, [stopPinging, stopHeartbeat]);

  // Touch start handler
  const handlePressStart = useCallback(
    async (e: React.TouchEvent | React.MouseEvent) => {
      // Prevent browser synthetic events or scrolling
      if ("touches" in e) {
        if (e.cancelable) e.preventDefault();
      }

      setIsHolding(true);
      triggerHaptic("medium");

      // Immediate ping to server
      const initialRes = await pingThumbKiss(true);
      if (initialRes.success) {
        setPartnerTouching(initialRes.partnerTouching);
        if (initialRes.matched) {
          setIsMatched(true);
          triggerHaptic("sparkUnlock");
          startHeartbeat();
        }
      }

      // Start ping loop while user is holding
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

  // Idle polling when modal is open but user is NOT holding thumb
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
    idlePollIntervalRef.current = setInterval(checkIdle, 1600);

    return () => {
      if (idlePollIntervalRef.current) {
        clearInterval(idlePollIntervalRef.current);
        idlePollIntervalRef.current = null;
      }
    };
  }, [isOpen, isHolding]);

  // Teardown when modal closes or unmounts
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

  // Handle escape key
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
        background: isMatched
          ? "radial-gradient(circle at center, #4A101D 0%, #20060C 60%, #0D0205 100%)"
          : "radial-gradient(circle at center, #260C14 0%, #15060A 60%, #0A0204 100%)",
        transition: "background 0.5s ease",
      }}
    >
      {/* Ambient background glow ring */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isMatched ? "opacity-100" : isHolding ? "opacity-40" : "opacity-20"
        }`}
        style={{
          background:
            "radial-gradient(circle at center, rgba(224,109,117,0.3) 0%, rgba(224,109,117,0) 70%)",
        }}
      />

      {/* Floating love particles when matched */}
      {isMatched && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute left-[20%] top-[55%] text-2xl animate-particle-1">
            💖
          </div>
          <div className="absolute left-[75%] top-[52%] text-xl animate-particle-2">
            ✨
          </div>
          <div className="absolute left-[35%] top-[60%] text-3xl animate-particle-3">
            💋
          </div>
          <div className="absolute left-[65%] top-[58%] text-2xl animate-particle-1">
            ❤️
          </div>
          <div className="absolute left-[48%] top-[65%] text-xl animate-particle-2">
            💕
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-md px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💋</span>
          <div>
            <h1 className="font-serif text-lg font-bold text-white tracking-wide">
              ThumbKiss
            </h1>
            <p className="text-[11px] text-white/60">
              Synchronized Touch
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handleRelease();
            onClose();
          }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-xs"
          aria-label="Close ThumbKiss"
        >
          <svg
            width="18"
            height="18"
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

      {/* Status Badge & Instruction */}
      <div className="relative z-20 w-full max-w-sm px-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all duration-300">
          {isMatched ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF4B72]/30 via-[#E06D75]/40 to-[#FF4B72]/30 border border-[#FF4B72]/60 shadow-[0_0_24px_rgba(255,75,114,0.5)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B72] animate-ping" />
              <span className="text-xs font-bold text-white tracking-wide">
                Touching Together with {partnerName}!
              </span>
            </div>
          ) : partnerTouching && !isHolding ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#E06D75]/30 to-[#D45B65]/30 border border-[#E06D75]/60 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E06D75] animate-ping" />
              <span className="text-xs font-bold text-white">
                {partnerName} is touching their screen! Hold now!
              </span>
            </div>
          ) : isHolding && !partnerTouching ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
              <span className="text-xs font-medium text-white/90">
                Holding touch... Waiting for {partnerName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15">
              <span className="text-xs text-white/75">
                Place and hold your thumb on the heart below
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
          {isMatched
            ? "Feel the synchronized heartbeat rhythm pulsating across your screens."
            : partnerTouching && !isHolding
            ? `${partnerName} is waiting for you! Place your thumb down to connect.`
            : isHolding
            ? `Keep holding your thumb. As soon as ${partnerName} touches their screen, you'll sync!`
            : `When you and ${partnerName} both touch your screens simultaneously, your phones beat together.`}
        </p>
      </div>

      {/* Central Tactile Touch Sensor Target */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto">
        {/* Shockwave ripple rings when matched */}
        {isMatched && (
          <>
            <div className="absolute w-56 h-56 rounded-full border-2 border-[#FF4B72]/60 animate-ripple pointer-events-none" />
            <div className="absolute w-56 h-56 rounded-full border-2 border-[#FF7E99]/50 animate-ripple-delayed pointer-events-none" />
            <div className="absolute w-56 h-56 rounded-full border border-white/40 animate-ripple-fast pointer-events-none" />
          </>
        )}

        {/* Pulse ring when user is holding or partner is waiting */}
        {!isMatched && (isHolding || partnerTouching) && (
          <div className="absolute w-52 h-52 rounded-full border border-[#E06D75]/40 animate-ripple pointer-events-none" />
        )}

        {/* The Touch Pad */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Touchpad - Hold your thumb here"
          onTouchStart={handlePressStart}
          onTouchEnd={handleRelease}
          onTouchCancel={handleRelease}
          onMouseDown={handlePressStart}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none ${
            isMatched
              ? "bg-gradient-to-br from-[#FF4B72] via-[#E06D75] to-[#B43A47] shadow-[0_0_60px_rgba(255,75,114,0.6)] scale-105"
              : isHolding
              ? "bg-gradient-to-br from-[#E06D75]/90 via-[#D05D66]/80 to-[#A3333F]/80 shadow-[0_0_40px_rgba(224,109,117,0.4)] scale-98"
              : partnerTouching
              ? "bg-white/15 border-2 border-[#E06D75] shadow-[0_0_30px_rgba(224,109,117,0.3)] animate-pulse"
              : "bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 shadow-[0_0_25px_rgba(0,0,0,0.4)]"
          }`}
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          {/* Fingerprint & Heart Graphic */}
          <div
            className={`transition-all duration-300 flex flex-col items-center justify-center ${
              isMatched ? "scale-115 animate-heartbeat" : ""
            }`}
          >
            {isMatched ? (
              <svg
                width="84"
                height="84"
                viewBox="0 0 24 24"
                fill="#FFFFFF"
                className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Fingerprint biometric SVG rings */}
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-colors duration-300 ${
                    isHolding
                      ? "text-white"
                      : partnerTouching
                      ? "text-[#FF8A96]"
                      : "text-white/60"
                  }`}
                >
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                  <path d="M2 16h.01" />
                  <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                  <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  <path d="M5.5 13.5a10.5 10.5 0 0 1-.5-3.5 8 8 0 0 1 15-3.5" />
                  <path d="M2 12a10 10 0 0 1 18-6" />
                  <path d="M12 2a10 10 0 0 0-10 10c0 2 .5 4 1 5" />
                  <path d="M17 19.5c0-.5-.5-1-1-1.5" />
                </svg>

                {/* Center glowing heart emblem */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-transform ${
                    isHolding ? "scale-110" : "scale-90"
                  }`}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill={isHolding ? "#FFFFFF" : "#E06D75"}
                    className="opacity-90 drop-shadow-md"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Subtext inside the pad */}
          <span
            className={`text-[11px] font-semibold mt-3 tracking-wide transition-colors ${
              isMatched
                ? "text-white"
                : isHolding
                ? "text-white/95"
                : "text-white/60"
            }`}
          >
            {isMatched
              ? "CONNECTED"
              : isHolding
              ? "HOLDING..."
              : partnerTouching
              ? "TOUCH NOW!"
              : "HOLD THUMB"}
          </span>
        </div>
      </div>

      {/* Bottom Hint Footer */}
      <footer className="relative z-20 w-full max-w-sm px-6 pb-8 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
          <p className="text-[11px] text-white/50 leading-snug">
            💡 <strong className="text-white/70">Tip:</strong> Turn off Silent Mode or
            ensure Vibration is enabled on your phone to feel the synchronized heartbeat.
          </p>
        </div>
      </footer>
    </div>
  );
}
