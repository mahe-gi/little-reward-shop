"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LudoGameState, LudoDare } from "@/lib/ludo-types";
import {
  getLudoGame,
  startLudoGame,
  rollLudoDice,
  moveLudoPawn,
  abandonLudoGame,
} from "@/actions/game";
import { LudoBoard } from "@/components/game/LudoBoard";
import { LudoDice } from "@/components/game/LudoDice";
import { LoveDareModal } from "@/components/game/LoveDareModal";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";
import { triggerHaptic } from "@/lib/haptics";
import { Avatar } from "@/components/ui/Avatar";

interface LudoGameClientProps {
  initialState: LudoGameState | null;
  gameId: string | null;
  currentUserId: string;
  partnerId: string;
  userBalance: number;
}

export function LudoGameClient({
  initialState,
  gameId: initialGameId,
  currentUserId,
  partnerId,
  userBalance,
}: LudoGameClientProps) {
  const router = useRouter();
  const [gameId, setGameId] = useState<string | null>(initialGameId);
  const [state, setState] = useState<LudoGameState | null>(initialState);
  const [loading, setLoading] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedStake, setSelectedStake] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<"couch" | "remote">("couch");
  const [activeDare, setActiveDare] = useState<LudoDare | null>(null);

  // Poll for opponent's turn in remote mode
  useEffect(() => {
    if (!gameId || state?.mode !== "remote" || state?.status === "COMPLETED") return;

    const interval = setInterval(async () => {
      // If it's not my turn, poll for updates
      if (state && state.turnUserId !== currentUserId) {
        const res = await getLudoGame();
        if (res.success && res.data?.state) {
          setState(res.data.state);
          if (res.data.state.winnerUserId) {
            triggerCelebration({ type: "hearts", count: 40 });
          }
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [gameId, state, currentUserId]);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      const res = await startLudoGame(selectedMode, selectedStake);
      if (res.success && res.gameId && res.state) {
        setGameId(res.gameId);
        setState(res.state);
        triggerHaptic("medium");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRollDice = async () => {
    if (!gameId || isRolling) return;
    setIsRolling(true);
    try {
      const res = await rollLudoDice(gameId);
      if (res.success && res.state) {
        setState(res.state);
        triggerHaptic("selection");
      }
    } finally {
      setIsRolling(false);
    }
  };

  const handleMovePawn = async (pawnId: string) => {
    if (!gameId) return;
    try {
      const res = await moveLudoPawn(gameId, pawnId);
      if (res.success && res.state) {
        setState(res.state);

        if (res.won) {
          triggerHaptic("sparkUnlock");
          triggerCelebration({ type: "hearts", count: 50 });
        } else if (res.captured) {
          triggerHaptic("heartbeat");
          triggerCelebration({ type: "hearts", count: 25 });
        } else if (res.dare) {
          setActiveDare(res.dare);
          triggerHaptic("light");
        } else {
          triggerHaptic("selection");
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleAbandon = async () => {
    if (!gameId) return;
    if (confirm("Are you sure you want to end this match?")) {
      await abandonLudoGame(gameId);
      setGameId(null);
      setState(null);
    }
  };

  // If no active game, show Start Match Screen
  if (!state || !gameId) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF7F2] p-4 max-w-md mx-auto justify-between">
        <div className="space-y-6 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/home"
              className="px-3 py-1.5 rounded-full bg-white border border-[#EAE6DE] text-xs font-semibold text-[#1E1A18] shadow-2xs hover:bg-[#FDFBF7]"
            >
              ← Back to Home
            </Link>
            <span className="text-xs text-[#756963] font-medium">
              Balance: <strong className="font-serif text-sm text-[#BA3F4A]">{userBalance} pts</strong>
            </span>
          </div>

          {/* Hero Banner */}
          <div className="text-center space-y-2 py-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FCEBEE] border border-[#E06D75]/30 flex items-center justify-center text-3xl shadow-sm animate-bounce">
              🎲
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1E1A18]">
              Love Ludo
            </h1>
            <p className="text-sm text-[#685E58] max-w-xs mx-auto">
              A 2-player romantic board race. Roll dice, advance your pawns to the Home Heart, and capture each other with sweet kisses!
            </p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A49B94]">
              Choose Play Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode("couch")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedMode === "couch"
                    ? "bg-white border-[#E06D75] ring-2 ring-[#E06D75]/20 shadow-sm"
                    : "bg-[#FDFBF7] border-[#EAE6DE] opacity-75"
                }`}
              >
                <span className="text-xl">🛋️</span>
                <div className="font-bold text-xs text-[#1E1A18] mt-1">Couch Mode</div>
                <div className="text-[10px] text-[#756963]">Pass & play together on 1 phone</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("remote")}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedMode === "remote"
                    ? "bg-white border-[#E06D75] ring-2 ring-[#E06D75]/20 shadow-sm"
                    : "bg-[#FDFBF7] border-[#EAE6DE] opacity-75"
                }`}
              >
                <span className="text-xl">📱</span>
                <div className="font-bold text-xs text-[#1E1A18] mt-1">Remote Mode</div>
                <div className="text-[10px] text-[#756963]">Turn-by-turn when apart with alerts</div>
              </button>
            </div>
          </div>

          {/* Stake Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A49B94]">
              Point Stakes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { pts: 0, label: "Friendly", sub: "Just for fun" },
                { pts: 5, label: "5 pts", sub: "Pot: 10 pts" },
                { pts: 10, label: "10 pts", sub: "Pot: 20 pts" },
              ].map((s) => (
                <button
                  key={s.pts}
                  type="button"
                  onClick={() => setSelectedStake(s.pts)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedStake === s.pts
                      ? "bg-[#FCEBEE] border-[#E06D75] text-[#BA3F4A] font-bold shadow-xs"
                      : "bg-white border-[#EAE6DE] text-[#1E1A18]"
                  }`}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="text-[9px] text-[#756963] mt-0.5">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start CTA */}
        <div className="pt-6 pb-4">
          <button
            type="button"
            onClick={handleStartGame}
            disabled={loading}
            className="w-full py-4 rounded-full bg-linear-to-r from-[#E06D75] to-[#B43A47] text-white font-semibold text-base shadow-lg shadow-[#E06D75]/30 active:scale-98 transition-all hover:brightness-105 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Preparing Board..." : "Start Love Ludo Match 🎲"}
          </button>
        </div>
      </div>
    );
  }

  // Active Game View
  const isP1 = state.turnUserId === state.player1.id;
  const isMyTurn = state.mode === "couch" || state.turnUserId === currentUserId;
  const currentTurnPlayer = isP1 ? state.player1 : state.player2;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] max-w-md mx-auto justify-between p-3 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/home"
          className="text-xs font-semibold text-[#685E58] hover:text-[#1E1A18] flex items-center gap-1"
        >
          ← Exit
        </Link>

        <div className="flex items-center gap-2">
          {state.stakePoints > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#FFFBF0] border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold">
              Pot: {state.stakePoints * 2} pts
            </span>
          )}
          <button
            type="button"
            onClick={handleAbandon}
            className="text-[11px] text-[#A49B94] hover:text-[#BA3F4A]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Players Header Card */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Player 1 (Rose) */}
        <div
          className={`p-2.5 rounded-2xl border transition-all ${
            isP1
              ? "bg-[#FCEBEE] border-[#E06D75] ring-2 ring-[#E06D75]/20 shadow-xs"
              : "bg-white border-[#EAE6DE] opacity-75"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{state.player1.avatar || "🌸"}</span>
            <div className="truncate">
              <div className="text-xs font-bold text-[#1E1A18] truncate">
                {state.player1.name}
              </div>
              <div className="text-[10px] text-[#BA3F4A] font-semibold">
                {isP1 ? "✦ Turn to move" : "P1 (Rose)"}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 (Gold) */}
        <div
          className={`p-2.5 rounded-2xl border transition-all ${
            !isP1
              ? "bg-[#FFFBF0] border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-xs"
              : "bg-white border-[#EAE6DE] opacity-75"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{state.player2.avatar || "✨"}</span>
            <div className="truncate">
              <div className="text-xs font-bold text-[#1E1A18] truncate">
                {state.player2.name}
              </div>
              <div className="text-[10px] text-[#D4AF37] font-semibold">
                {!isP1 ? "✦ Turn to move" : "P2 (Gold)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The 2-Player Ludo Board */}
      <div className="my-auto py-1">
        <LudoBoard
          pawns={state.pawns}
          movablePawnIds={state.movablePawnIds}
          player1={state.player1}
          player2={state.player2}
          turnUserId={state.turnUserId}
          hasRolled={state.hasRolled}
          onMovePawn={handleMovePawn}
        />
      </div>

      {/* Action Console & Dice */}
      <div className="space-y-3 pt-2 pb-4">
        {/* Status / Announcement Pill */}
        <div className="px-4 py-2 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs text-center">
          <p className="text-xs font-medium text-[#1E1A18]">
            {state.lastActionMessage}
          </p>
        </div>

        {/* Couch Mode Pass Prompt */}
        {state.mode === "couch" && (
          <div className="text-center text-[11px] font-semibold text-[#BA3F4A]">
            🛋️ Pass phone to: <strong>{currentTurnPlayer.name}</strong>
          </div>
        )}

        {/* Dice Controller */}
        <div className="flex justify-center">
          <LudoDice
            value={state.dice}
            isRolling={isRolling}
            disabled={!isMyTurn}
            isTurn={isMyTurn}
            hasRolled={state.hasRolled}
            onRoll={handleRollDice}
          />
        </div>
      </div>

      {/* Love Dare Modal */}
      <LoveDareModal
        dare={activeDare}
        onDismiss={() => setActiveDare(null)}
      />

      {/* Winner Celebration Modal */}
      {state.winnerUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] border border-[#EAE6DE] shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <span className="text-5xl animate-bounce">🏆</span>
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#BA3F4A]">
                Match Completed
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1E1A18]">
                {state.winnerUserId === state.player1.id
                  ? state.player1.name
                  : state.player2.name}{" "}
                Wins! 💖
              </h2>
              <p className="text-xs text-[#685E58]">
                Both pawns reached the Home Heart! What an adorable race.
              </p>
              {state.stakePoints > 0 && (
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#FFFBF0] text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/30">
                    Won Pot: +{state.stakePoints * 2} Points!
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setGameId(null);
                  setState(null);
                }}
                className="w-full py-3.5 rounded-full bg-linear-to-r from-[#E06D75] to-[#B43A47] text-white font-semibold text-sm shadow-md active:scale-98 transition-all hover:brightness-105"
              >
                Play Another Match 🎲
              </button>
              <Link
                href="/home"
                className="block w-full py-2.5 text-xs text-[#756963] font-medium hover:text-[#1E1A18]"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
