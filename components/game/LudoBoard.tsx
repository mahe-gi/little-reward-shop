"use client";

import React from "react";
import { PawnState, SAFE_TILES, LEAP_TILES } from "@/lib/ludo-types";
import { Avatar } from "@/components/ui/Avatar";

interface LudoBoardProps {
  pawns: Record<string, PawnState>;
  movablePawnIds: string[];
  player1: { id: string; name: string; avatar: string | null; color: "rose" };
  player2: { id: string; name: string; avatar: string | null; color: "gold" };
  turnUserId: string;
  hasRolled: boolean;
  onMovePawn: (pawnId: string) => void;
}

// 6x6 grid perimeter tile coordinates (col, row from 0 to 5)
const TILE_COORDS: Record<number, { col: number; row: number }> = {
  0: { col: 0, row: 0 },
  1: { col: 1, row: 0 },
  2: { col: 2, row: 0 },
  3: { col: 3, row: 0 },
  4: { col: 4, row: 0 },
  5: { col: 5, row: 0 },
  6: { col: 5, row: 1 },
  7: { col: 5, row: 2 },
  8: { col: 5, row: 3 },
  9: { col: 5, row: 4 },
  10: { col: 5, row: 5 },
  11: { col: 4, row: 5 },
  12: { col: 3, row: 5 },
  13: { col: 2, row: 5 },
  14: { col: 1, row: 5 },
  15: { col: 0, row: 5 },
  16: { col: 0, row: 4 },
  17: { col: 0, row: 3 },
  18: { col: 0, row: 2 },
  19: { col: 0, row: 1 },
};

// Home stretch steps 20, 21, 22 inward coordinates
const P1_HOME_STRETCH: Record<number, { col: number; row: number }> = {
  20: { col: 1, row: 1 },
  21: { col: 2, row: 1 },
  22: { col: 2, row: 2 },
};

const P2_HOME_STRETCH: Record<number, { col: number; row: number }> = {
  20: { col: 4, row: 4 },
  21: { col: 3, row: 4 },
  22: { col: 3, row: 3 },
};

export function LudoBoard({
  pawns,
  movablePawnIds,
  player1,
  player2,
  turnUserId,
  hasRolled,
  onMovePawn,
}: LudoBoardProps) {
  // Group pawns by location
  const p1BasePawns = ["p1_0", "p1_1"].filter((id) => pawns[id]?.stepCount === -1);
  const p2BasePawns = ["p2_0", "p2_1"].filter((id) => pawns[id]?.stepCount === -1);
  const homeFinishedPawns = Object.keys(pawns).filter((id) => pawns[id]?.stepCount === 23);

  const renderPawnToken = (pawnId: string) => {
    const isP1 = pawnId.startsWith("p1_");
    const isMovable = movablePawnIds.includes(pawnId);
    const player = isP1 ? player1 : player2;

    const isEmoji =
      player.avatar &&
      !player.avatar.startsWith("http") &&
      player.avatar.length <= 4;
    const tokenLabel = isEmoji
      ? player.avatar
      : player.name?.charAt(0).toUpperCase() || (isP1 ? "1" : "2");

    return (
      <button
        key={pawnId}
        type="button"
        disabled={!isMovable}
        onClick={() => onMovePawn(pawnId)}
        aria-label={`${player.name} pawn ${pawnId}`}
        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 select-none shadow-md ${
          isP1
            ? "bg-linear-to-br from-[#E06D75] to-[#B43A47] text-white border-2 border-white"
            : "bg-linear-to-br from-[#E6C766] to-[#D4AF37] text-[#1E1A18] border-2 border-white"
        } ${
          isMovable
            ? "cursor-pointer scale-110 ring-3 ring-[#BA3F4A] animate-bounce z-30"
            : "cursor-default z-10"
        }`}
      >
        <span className="text-xs font-bold leading-none">{tokenLabel}</span>
        {isMovable && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white animate-ping" />
        )}
      </button>
    );
  };

  return (
    <div className="relative w-full aspect-square max-w-[380px] mx-auto p-2 bg-[#FDFBF7] rounded-3xl border border-[#EAE6DE] shadow-xl overflow-hidden select-none">
      {/* 6x6 Grid Background */}
      <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-1.5 p-1 relative">
        {/* Render 20 Perimeter Tiles */}
        {Object.entries(TILE_COORDS).map(([tileStr, { col, row }]) => {
          const tileNum = Number(tileStr);
          const isSafe = SAFE_TILES.includes(tileNum);
          const isLeap = LEAP_TILES.includes(tileNum);
          const isDare = tileNum === 4 || tileNum === 14;
          const isP1Start = tileNum === 0;
          const isP2Start = tileNum === 10;

          // Find pawns currently on this tile
          const occupants = Object.keys(pawns).filter(
            (id) => pawns[id]?.stepCount >= 0 && pawns[id]?.stepCount < 20 && pawns[id]?.position === tileNum
          );

          return (
            <div
              key={`tile-${tileNum}`}
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
              className={`relative rounded-xl border flex items-center justify-center transition-colors ${
                isP1Start
                  ? "bg-[#FCEBEE] border-[#E06D75]/40 text-[#BA3F4A]"
                  : isP2Start
                  ? "bg-[#FFFBF0] border-[#D4AF37]/40 text-[#D4AF37]"
                  : isDare
                  ? "bg-[#FFF0F3] border-[#E06D75]/30 text-[#BA3F4A]"
                  : isLeap
                  ? "bg-[#F4F9F5] border-[#7E9F85]/40 text-[#7E9F85]"
                  : isSafe
                  ? "bg-[#FAF7F2] border-[#EAE6DE] text-[#A49B94]"
                  : "bg-white border-[#EAE6DE]/80 text-[#A49B94]"
              }`}
            >
              {/* Tile Indicators */}
              {occupants.length === 0 && (
                <div className="flex flex-col items-center justify-center text-[10px] font-semibold leading-none pointer-events-none">
                  {isP1Start ? (
                    <span>🏁 1</span>
                  ) : isP2Start ? (
                    <span>🏁 2</span>
                  ) : isDare ? (
                    <span>{tileNum === 4 ? "💋" : "🎙️"}</span>
                  ) : isLeap ? (
                    <span>⚡+2</span>
                  ) : isSafe ? (
                    <span>⭐</span>
                  ) : (
                    <span className="text-[8px] text-[#A49B94]/60">{tileNum}</span>
                  )}
                </div>
              )}

              {/* Render occupants */}
              {occupants.length > 0 && (
                <div className="flex items-center justify-center -space-x-2">
                  {occupants.map((pid) => renderPawnToken(pid))}
                </div>
              )}
            </div>
          );
        })}

        {/* Player 1 Home Stretch Tiles (Steps 20, 21, 22) */}
        {Object.entries(P1_HOME_STRETCH).map(([stepStr, { col, row }]) => {
          const stepNum = Number(stepStr);
          const occupants = Object.keys(pawns).filter(
            (id) => id.startsWith("p1_") && pawns[id]?.stepCount === stepNum
          );
          return (
            <div
              key={`p1-step-${stepNum}`}
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
              className="rounded-lg bg-[#FCEBEE]/70 border border-[#E06D75]/30 flex items-center justify-center"
            >
              {occupants.length > 0 ? (
                occupants.map((pid) => renderPawnToken(pid))
              ) : (
                <span className="text-[9px] text-[#BA3F4A]/60 font-bold">♥</span>
              )}
            </div>
          );
        })}

        {/* Player 2 Home Stretch Tiles (Steps 20, 21, 22) */}
        {Object.entries(P2_HOME_STRETCH).map(([stepStr, { col, row }]) => {
          const stepNum = Number(stepStr);
          const occupants = Object.keys(pawns).filter(
            (id) => id.startsWith("p2_") && pawns[id]?.stepCount === stepNum
          );
          return (
            <div
              key={`p2-step-${stepNum}`}
              style={{ gridColumn: col + 1, gridRow: row + 1 }}
              className="rounded-lg bg-[#FFFBF0]/70 border border-[#D4AF37]/30 flex items-center justify-center"
            >
              {occupants.length > 0 ? (
                occupants.map((pid) => renderPawnToken(pid))
              ) : (
                <span className="text-[9px] text-[#D4AF37]/60 font-bold">★</span>
              )}
            </div>
          );
        })}

        {/* Center Sanctuary Home Heart 💖 (step 23 for both) */}
        <div
          style={{ gridColumn: "3 / 5", gridRow: "3 / 5" }}
          className="relative z-20 rounded-2xl bg-linear-to-br from-[#FFF5F6] via-white to-[#FFFBF0] border-2 border-[#E06D75]/40 flex flex-col items-center justify-center shadow-inner p-1"
        >
          <span className="text-2xl animate-pulse">💖</span>
          <span className="text-[9px] font-bold tracking-wider uppercase text-[#BA3F4A]">
            Home
          </span>

          {homeFinishedPawns.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-white/80 rounded-2xl backdrop-blur-xs">
              {homeFinishedPawns.map((pid) => renderPawnToken(pid))}
            </div>
          )}
        </div>

        {/* Player 1 Base Yard (Top-Left Yard) */}
        <div
          style={{ gridColumn: "2 / 4", gridRow: "2 / 3" }}
          className="rounded-xl bg-[#FCEBEE]/50 border border-dashed border-[#E06D75]/40 flex items-center justify-center gap-1.5 p-1"
        >
          {p1BasePawns.length > 0 ? (
            p1BasePawns.map((pid) => renderPawnToken(pid))
          ) : (
            <span className="text-[10px] text-[#BA3F4A]/50 font-medium">P1 Yard</span>
          )}
        </div>

        {/* Player 2 Base Yard (Bottom-Right Yard) */}
        <div
          style={{ gridColumn: "4 / 6", gridRow: "4 / 5" }}
          className="rounded-xl bg-[#FFFBF0]/50 border border-dashed border-[#D4AF37]/40 flex items-center justify-center gap-1.5 p-1"
        >
          {p2BasePawns.length > 0 ? (
            p2BasePawns.map((pid) => renderPawnToken(pid))
          ) : (
            <span className="text-[10px] text-[#D4AF37]/50 font-medium">P2 Yard</span>
          )}
        </div>
      </div>
    </div>
  );
}
