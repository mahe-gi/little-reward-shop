"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getLudoGame } from "@/actions/game";

export function LudoHomeWidget() {
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [stake, setStake] = useState<number>(0);

  useEffect(() => {
    getLudoGame().then((res) => {
      if (res.success && res.data?.state) {
        setHasActiveGame(true);
        setStake(res.data.state.stakePoints);
      }
    });
  }, []);

  return (
    <Link
      href="/game/ludo"
      className="group relative flex items-center justify-between p-4 rounded-3xl bg-linear-to-br from-[#FFFDF9] to-[#FAF7F2] border border-[#EAE6DE] shadow-xs hover:shadow-md transition-all duration-300 active:scale-[0.99] overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-[#E06D75]/10 blur-2xl group-hover:bg-[#E06D75]/15 transition-all" />

      <div className="flex items-center gap-3.5 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#FCEBEE] to-[#FFF0F3] border border-[#E06D75]/30 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
          🎲
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-base font-bold text-[#1E1A18]">
              Love Ludo
            </h4>
            {hasActiveGame ? (
              <span className="px-2 py-0.5 rounded-full bg-[#E06D75] text-white text-[10px] font-bold animate-pulse">
                Active Match
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EAE6DE] text-[#756963] text-[10px] font-semibold">
                Mini Game
              </span>
            )}
          </div>
          <p className="text-xs text-[#685E58] mt-0.5 font-sans">
            {hasActiveGame
              ? stake > 0
                ? `Pot: ${stake * 2} pts • Tap to continue`
                : "Match in progress • Tap to continue"
              : "Race to the Home Heart with sweet kisses & dares"}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-1 text-xs font-bold text-[#BA3F4A] group-hover:translate-x-0.5 transition-transform">
        <span>Play</span>
        <span>→</span>
      </div>
    </Link>
  );
}
