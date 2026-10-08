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
  getDestinationCoord,
  getCoordForStep,
} from "@/lib/ludo-types";

interface LudoBoardProps {
  pawns: Record<string, PawnState>;
  movablePawnIds: string[];
  pawnCount: number;
  player1: { id: string; name: string; avatar: string | null; color: "rose" };
  player2: { id: string; name: string; avatar: string | null; color: "gold" };
  turnUserId: string;
  hasRolled: boolean;
  diceValue?: number | null;
  animatingPawn?: { id: string; col: number; row: number } | null;
  onMovePawn: (pawnId: string) => void;
}

export function LudoBoard({
  pawns,
  movablePawnIds,
  pawnCount,
  player1,
  player2,
  turnUserId,
  hasRolled,
  diceValue,
  animatingPawn,
  onMovePawn,
}: LudoBoardProps) {
  const isP1Turn = turnUserId === player1.id;
  const playerNum = isP1Turn ? 1 : 2;

  // Calculate destination landing squares for movable pawns
  const destinationCoords: { col: number; row: number; pawnId: string }[] = [];
  if (hasRolled && diceValue) {
    for (const pid of movablePawnIds) {
      const p = pawns[pid];
      if (p) {
        const dest = getDestinationCoord(playerNum, p.stepCount, diceValue);
        if (dest) {
          destinationCoords.push({ ...dest, pawnId: pid });
        }
      }
    }
  }

  // Determine pawn locations on the 15x15 board
  const getPawnPixelCoord = (pawnId: string): { col: number; row: number } | null => {
    if (animatingPawn && animatingPawn.id === pawnId) {
      return { col: animatingPawn.col, row: animatingPawn.row };
    }
    const p = pawns[pawnId];
    if (!p) return null;
    const isP1 = pawnId.startsWith("p1_");
    const pawnIndex = parseInt(pawnId.split("_")[1], 10) || 0;
    return getCoordForStep(isP1 ? 1 : 2, p.stepCount, pawnIndex);
  };

  // Group active pawns to prevent overlapping
  const activePawns = Object.keys(pawns).filter((pid) => {
    const idx = parseInt(pid.split("_")[1], 10);
    return idx < pawnCount;
  });

  return (
    <div className="relative w-full aspect-square max-w-[min(370px,88vw,46vh)] mx-auto p-1.5 bg-[#FAF7F2] rounded-3xl border-2 border-[#EAE6DE] shadow-2xl select-none overflow-hidden shrink-0">
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

        {/* ---------------- 1. CORNER YARDS (2-PLAYER FOCUSED) ---------------- */}
        {/* Top-Left: Player 1 (Red / Rose) Yard */}
        <rect x="0" y="0" width="6" height="6" fill="#EF4444" />
        <rect x="1" y="1" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="2" cy="2" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="4" cy="2" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="2" cy="4" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />
        <circle cx="4" cy="4" r="0.6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="0.08" />

        {/* Top-Right: Clean Neutral Zone */}
        <rect x="9" y="0" width="6" height="6" fill="#F6F2EB" />
        <rect x="10" y="1" width="4" height="4" rx="0.5" fill="#FFFFFF" stroke="#EAE4D9" strokeWidth="0.04" />
        <text x="12" y="3.3" textAnchor="middle" fontSize="0.7" fill="#C8BFB2">🎲</text>

        {/* Bottom-Right: Player 2 (Yellow / Gold) Yard */}
        <rect x="9" y="9" width="6" height="6" fill="#EAB308" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" fill="#FFFFFF" />
        <circle cx="11" cy="11" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="13" cy="11" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="11" cy="13" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />
        <circle cx="13" cy="13" r="0.6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="0.08" />

        {/* Bottom-Left: Clean Neutral Zone */}
        <rect x="0" y="9" width="6" height="6" fill="#F6F2EB" />
        <rect x="1" y="10" width="4" height="4" rx="0.5" fill="#FFFFFF" stroke="#EAE4D9" strokeWidth="0.04" />
        <text x="3" y="12.3" textAnchor="middle" fontSize="0.7" fill="#C8BFB2">🎲</text>

        {/* ---------------- 2. CENTER HOME (RED & YELLOW BAYS) ---------------- */}
        {/* Red Home Triangle (Left bay) */}
        <polygon points="6,6 7.5,7.5 6,9" fill="#EF4444" stroke="#DC2626" strokeWidth="0.04" />
        <text x="6.45" y="7.62" textAnchor="middle" fontSize="0.4" fill="#FFFFFF" fontWeight="900">★</text>

        {/* Yellow Home Triangle (Right bay) */}
        <polygon points="9,6 7.5,7.5 9,9" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.04" />
        <text x="8.55" y="7.62" textAnchor="middle" fontSize="0.4" fill="#FFFFFF" fontWeight="900">★</text>

        {/* Neutral Top & Bottom Center Triangles */}
        <polygon points="6,6 7.5,7.5 9,6" fill="#F5EFE6" stroke="#E5DDD0" strokeWidth="0.04" />
        <polygon points="6,9 7.5,7.5 9,9" fill="#F5EFE6" stroke="#E5DDD0" strokeWidth="0.04" />

        {/* Center Victory Trophy Emblem */}
        <circle cx="7.5" cy="7.5" r="0.46" fill="#FFFFFF" stroke="#E5DDD0" strokeWidth="0.04" />
        <text x="7.5" y="7.65" textAnchor="middle" fontSize="0.34" fontWeight="bold">🏆</text>

        {/* ---------------- 3. COLORED HOME LANES ---------------- */}
        {/* Red Home Lane (row 7, col 1..5) */}
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

        {/* Neutral Top Lane (col 7, row 1..5) */}
        {[1, 2, 3, 4, 5].map((r) => (
          <rect
            key={`neutral-home-top-${r}`}
            x="7"
            y={r}
            width="1"
            height="1"
            fill="#FAF7F2"
            stroke="#E5E7EB"
            strokeWidth="0.03"
          />
        ))}

        {/* Yellow Home Lane (row 7, col 9..13) */}
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

        {/* Neutral Bottom Lane (col 7, row 9..13) */}
        {[9, 10, 11, 12, 13].map((r) => (
          <rect
            key={`neutral-home-bot-${r}`}
            x="7"
            y={r}
            width="1"
            height="1"
            fill="#FAF7F2"
            stroke="#E5E7EB"
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
          else if (isP2Start) tileFill = "#EAB308";

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
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF" fontWeight="bold">
                  ★
                </text>
              )}
              {isP2Start && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#FFFFFF" fontWeight="bold">
                  ★
                </text>
              )}
              {isSafe && !isP1Start && !isP2Start && (
                <text x={c.col + 0.5} y={c.row + 0.65} textAnchor="middle" fontSize="0.45" fill="#9CA3AF">
                  ⭐
                </text>
              )}
            </g>
          );
        })}

        {/* ---------------- 4.5 LANDING TARGET HIGHLIGHTS ---------------- */}
        {!animatingPawn &&
          destinationCoords.map((dest, i) => (
            <g key={`dest-${dest.pawnId}-${i}`} className="pointer-events-none">
              <circle
                cx={dest.col}
                cy={dest.row}
                r="0.45"
                fill={playerNum === 1 ? "rgba(239, 68, 68, 0.22)" : "rgba(234, 179, 8, 0.22)"}
                stroke={playerNum === 1 ? "#EF4444" : "#EAB308"}
                strokeWidth="0.06"
                strokeDasharray="0.12 0.08"
              />
              <circle
                cx={dest.col}
                cy={dest.row}
                r="0.18"
                fill={playerNum === 1 ? "#EF4444" : "#EAB308"}
                opacity="0.85"
              />
              <text
                x={dest.col}
                y={dest.row + 0.07}
                textAnchor="middle"
                fontSize="0.22"
                fill="#FFFFFF"
                fontWeight="900"
              >
                ★
              </text>
            </g>
          ))}

        {/* ---------------- 5. AUTHENTIC 3D LUDO PAWNS ---------------- */}
        {activePawns.map((pawnId) => {
          const coord = getPawnPixelCoord(pawnId);
          if (!coord) return null;

          const isP1 = pawnId.startsWith("p1_");
          const isMovable = !animatingPawn && movablePawnIds.includes(pawnId);
          const player = isP1 ? player1 : player2;
          const initial = player.name?.charAt(0).toUpperCase() || (isP1 ? "1" : "2");

          return (
            <g
              key={`pawn-token-${pawnId}`}
              transform={`translate(${coord.col}, ${coord.row})`}
              style={{ transition: "transform 0.11s linear", willChange: "transform" }}
              className={isMovable ? "cursor-pointer" : "cursor-default"}
              onClick={() => {
                if (isMovable) onMovePawn(pawnId);
              }}
            >
              {/* Invisible large touch target circle for mobile tap reliability */}
              <circle
                cx="0"
                cy="0"
                r="0.8"
                fill="transparent"
                style={{ pointerEvents: isMovable ? "all" : "none" }}
              />

              {/* Movable aura glow */}
              {isMovable && (
                <circle
                  cx="0"
                  cy="0"
                  r="0.55"
                  fill="none"
                  stroke={isP1 ? "#EF4444" : "#EAB308"}
                  strokeWidth="0.09"
                  className="animate-pulse"
                />
              )}

              {/* 3D Pawn Shape: Skirt Base */}
              <circle
                cx="0"
                cy="0"
                r={isMovable ? 0.42 : 0.38}
                fill={isP1 ? "url(#p1-grad)" : "url(#p2-grad)"}
                stroke={isMovable ? "#FFE082" : "#FFFFFF"}
                strokeWidth={isMovable ? 0.08 : 0.05}
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
