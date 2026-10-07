"use client";

import React from "react";
import {
  PawnState,
  CLASSIC_TRACK_COORDS,
  CLASSIC_SAFE_TILES,
  P1_HOME_COORDS,
  P2_HOME_COORDS,
  P1_YARD_SLOTS,
  P2_YARD_SLOTS,
  CENTER_HOME_COORD,
} from "@/lib/ludo-types";

interface LudoBoardProps {
  pawns: Record<string, PawnState>;
  movablePawnIds: string[];
  pawnCount: number;
  player1: { id: string; name: string; avatar: string | null; color: "rose" };
  player2: { id: string; name: string; avatar: string | null; color: "gold" };
  turnUserId: string;
  hasRolled: boolean;
  onMovePawn: (pawnId: string) => void;
}

export function LudoBoard({
  pawns,
  movablePawnIds,
  pawnCount,
  player1,
  player2,
  onMovePawn,
}: LudoBoardProps) {
  // Determine pawn locations on the 15x15 board
  const getPawnPixelCoord = (pawnId: string): { col: number; row: number } | null => {
    const p = pawns[pawnId];
    if (!p) return null;
    const isP1 = pawnId.startsWith("p1_");
    const pawnIndex = parseInt(pawnId.split("_")[1], 10) || 0;

    // 1. In Yard
    if (p.stepCount === -1) {
      if (isP1) {
        return P1_YARD_SLOTS[pawnIndex] || { col: 2.5, row: 2.5 };
      } else {
        return P2_YARD_SLOTS[pawnIndex] || { col: 11.5, row: 11.5 };
      }
    }

    // 2. On 52-tile circuit (steps 0..50)
    if (p.stepCount <= 50) {
      const tileIdx = p.position;
      if (tileIdx >= 0 && tileIdx < CLASSIC_TRACK_COORDS.length) {
        const c = CLASSIC_TRACK_COORDS[tileIdx];
        return { col: c.col + 0.5, row: c.row + 0.5 };
      }
    }

    // 3. In colored home row (steps 51..55)
    if (p.stepCount >= 51 && p.stepCount <= 55) {
      const homeIdx = p.stepCount - 51;
      const c = isP1 ? P1_HOME_COORDS[homeIdx] : P2_HOME_COORDS[homeIdx];
      if (c) return { col: c.col + 0.5, row: c.row + 0.5 };
    }

    // 4. In Center Home Triangle (step 56)
    if (p.stepCount === 56) {
      return isP1
        ? { col: 6.8 + (pawnIndex % 2) * 0.7, row: 7.2 + Math.floor(pawnIndex / 2) * 0.7 }
        : { col: 7.6 + (pawnIndex % 2) * 0.7, row: 7.2 + Math.floor(pawnIndex / 2) * 0.7 };
    }

    return null;
  };

  // Group active pawns to prevent overlapping
  const activePawns = Object.keys(pawns).filter((pid) => {
    const idx = parseInt(pid.split("_")[1], 10);
    return idx < pawnCount;
  });

  return (
    <div className="relative w-full aspect-square max-w-[420px] mx-auto p-1.5 bg-[#FAF7F2] rounded-3xl border-2 border-[#EAE6DE] shadow-2xl select-none overflow-hidden">
      <svg
        viewBox="0 0 15 15"
        className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-inner"
        style={{ shapeRendering: "geometricPrecision" }}
      >
        <defs>
          {/* Subtle drop shadow for authentic 3D pawns */}
          <filter id="pawn-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0.12" stdDeviation="0.1" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <filter id="movable-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.22" floodColor="#BA3F4A" floodOpacity="0.8" />
          </filter>

          <radialGradient id="p1-grad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#B91C1C" />
          </radialGradient>
          <radialGradient id="p2-grad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#CA8A04" />
          </radialGradient>
        </defs>

        {/* ---------------- 1. FOUR CORNER YARDS ---------------- */}
        {/* Top-Left: Player 1 (Red / Rose) Yard */}
        <rect x="0" y="0" width="6" height="6" fill="#EF4444" />
        <rect x="1" y="1" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="2" cy="2" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="4" cy="2" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="2" cy="4" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="4" cy="4" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />

        {/* Top-Right: Green Yard */}
        <rect x="9" y="0" width="6" height="6" fill="#10B981" />
        <rect x="10" y="1" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="11" cy="2" r="0.6" fill="#D1FAE5" stroke="#10B981" strokeWidth="0.08" />
        <circle cx="13" cy="2" r="0.6" fill="#D1FAE5" stroke="#10B981" strokeWidth="0.08" />
        <circle cx="11" cy="4" r="0.6" fill="#D1FAE5" stroke="#10B981" strokeWidth="0.08" />
        <circle cx="13" cy="4" r="0.6" fill="#D1FAE5" stroke="#10B981" strokeWidth="0.08" />

        {/* Bottom-Right: Player 2 (Yellow / Gold) Yard */}
        <rect x="9" y="9" width="6" height="6" fill="#EAB308" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="11" cy="11" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="13" cy="11" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="11" cy="13" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="13" cy="13" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />

        {/* Bottom-Left: Blue Yard */}
        <rect x="0" y="9" width="6" height="6" fill="#3B82F6" />
        <rect x="1" y="10" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="2" cy="11" r="0.6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="0.08" />
        <circle cx="4" cy="11" r="0.6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="0.08" />
        <circle cx="2" cy="13" r="0.6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="0.08" />
        <circle cx="4" cy="13" r="0.6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="0.08" />

        {/* ---------------- 2. CENTER HOME TRIANGLES ---------------- */}
        <polygon points="6,6 7.5,7.5 6,9" fill="#EF4444" />
        <polygon points="6,6 7.5,7.5 9,6" fill="#10B981" />
        <polygon points="9,6 7.5,7.5 9,9" fill="#EAB308" />
        <polygon points="6,9 7.5,7.5 9,9" fill="#3B82F6" />
        {/* Center decorative ring */}
        <circle cx="7.5" cy="7.5" r="0.45" fill="#FFFFFF" />
        <text x="7.5" y="7.65" textAnchor="middle" fontSize="0.4" fontWeight="bold">💖</text>

        {/* ---------------- 3. COLORED HOME COLUMNS ---------------- */}
        {/* Red Home Column (row 7, col 1..5) */}
        {P1_HOME_COORDS.map((c, i) => (
          <rect
            key={`p1-home-${i}`}
            x={c.col}
            y={c.row}
            width="1"
            height="1"
            fill="#EF4444"
            stroke="#DC2626"
            strokeWidth="0.03"
          />
        ))}

        {/* Green Home Column (col 7, row 1..5) */}
        {[1, 2, 3, 4, 5].map((r) => (
          <rect
            key={`green-home-${r}`}
            x="7"
            y={r}
            width="1"
            height="1"
            fill="#10B981"
            stroke="#059669"
            strokeWidth="0.03"
          />
        ))}

        {/* Yellow Home Column (row 7, col 9..13) */}
        {P2_HOME_COORDS.map((c, i) => (
          <rect
            key={`p2-home-${i}`}
            x={c.col}
            y={c.row}
            width="1"
            height="1"
            fill="#EAB308"
            stroke="#CA8A04"
            strokeWidth="0.03"
          />
        ))}

        {/* Blue Home Column (col 7, row 9..13) */}
        {[9, 10, 11, 12, 13].map((r) => (
          <rect
            key={`blue-home-${r}`}
            x="7"
            y={r}
            width="1"
            height="1"
            fill="#3B82F6"
            stroke="#2563EB"
            strokeWidth="0.03"
          />
        ))}

        {/* ---------------- 4. 52 COMMON CIRCUIT TILES ---------------- */}
        {CLASSIC_TRACK_COORDS.map((c, idx) => {
          const isP1Start = idx === 0;
          const isGreenStart = idx === 13;
          const isP2Start = idx === 26;
          const isBlueStart = idx === 39;
          const isSafe = CLASSIC_SAFE_TILES.includes(idx);

          let tileFill = "#FFFFFF";
          if (isP1Start) tileFill = "#EF4444";
          else if (isGreenStart) tileFill = "#10B981";
          else if (isP2Start) tileFill = "#EAB308";
          else if (isBlueStart) tileFill = "#3B82F6";

          return (
            <g key={`tile-${idx}`}>
              <rect
                x={c.col}
                y={c.row}
                width="1"
                height="1"
                fill={tileFill}
                stroke="#D1D5DB"
                strokeWidth="0.03"
              />

              {/* Start square indicators & Star icons */}
              {isP1Start && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF">
                  ★
                </text>
              )}
              {isGreenStart && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF">
                  ★
                </text>
              )}
              {isP2Start && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF">
                  ★
                </text>
              )}
              {isBlueStart && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF">
                  ★
                </text>
              )}
              {isSafe && !isP1Start && !isGreenStart && !isP2Start && !isBlueStart && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#9CA3AF">
                  ⭐
                </text>
              )}
            </g>
          );
        })}

        {/* ---------------- 5. AUTHENTIC 3D LUDO PAWNS ---------------- */}
        {activePawns.map((pawnId) => {
          const coord = getPawnPixelCoord(pawnId);
          if (!coord) return null;

          const isP1 = pawnId.startsWith("p1_");
          const isMovable = movablePawnIds.includes(pawnId);
          const player = isP1 ? player1 : player2;
          const initial = player.name?.charAt(0).toUpperCase() || (isP1 ? "1" : "2");

          return (
            <g
              key={`pawn-token-${pawnId}`}
              transform={`translate(${coord.col}, ${coord.row})`}
              className={`transition-all duration-300 ${
                isMovable ? "cursor-pointer animate-pulse" : "cursor-default"
              }`}
              onClick={() => {
                if (isMovable) onMovePawn(pawnId);
              }}
            >
              {/* Movable aura glow */}
              {isMovable && (
                <circle
                  cx="0"
                  cy="0"
                  r="0.52"
                  fill="none"
                  stroke="#BA3F4A"
                  strokeWidth="0.09"
                  className="animate-ping"
                />
              )}

              {/* 3D Pawn Shape: Skirt Base */}
              <circle
                cx="0"
                cy="0"
                r="0.38"
                fill={isP1 ? "url(#p1-grad)" : "url(#p2-grad)"}
                stroke="#FFFFFF"
                strokeWidth="0.05"
                filter="url(#pawn-shadow)"
              />

              {/* Pawn Head */}
              <circle
                cx="0"
                cy="-0.04"
                r="0.22"
                fill={isP1 ? "#B91C1C" : "#CA8A04"}
                stroke="#FFFFFF"
                strokeWidth="0.03"
              />

              {/* Monogram Initial */}
              <text
                x="0"
                y="0.04"
                textAnchor="middle"
                fontSize="0.22"
                fontWeight="900"
                fill="#FFFFFF"
                style={{ fontFamily: "sans-serif", pointerEvents: "none" }}
              >
                {initial}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
