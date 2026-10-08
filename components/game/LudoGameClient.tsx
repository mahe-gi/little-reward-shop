"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LudoGameState, getCoordForStep } from "@/lib/ludo-types";
import {
  getLudoGame,
  startLudoGame,
  rollLudoDice,
  moveLudoPawn,
  abandonLudoGame,
} from "@/actions/game";
import { LudoBoard } from "@/components/game/LudoBoard";
import { LudoDice } from "@/components/game/LudoDice";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";
import { triggerHaptic } from "@/lib/haptics";
import { Avatar } from "@/components/ui/Avatar";
import {
  playDiceRollSound,
  playStepSound,
  playCaptureSound,
  playHomeSound,
  playVictorySound,
  isSoundEnabled,
  toggleSound,
} from "@/lib/sound-effects";

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
  const [selectedPawnCount, setSelectedPawnCount] = useState<2 | 4>(4);
  const [captureAlert, setCaptureAlert] = useState<{ killer: string; victim: string } | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [animatingPawn, setAnimatingPawn] = useState<{ id: string; col: number; row: number } | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  // Poll for opponent's turn in remote mode with low latency (1000ms) and focus listener
  useEffect(() => {
    if (!gameId || state?.mode !== "remote" || state?.status === "COMPLETED") return;

    let isSubscribed = true;

    const pollGame = async () => {
      if (!isSubscribed) return;
      if (state && state.turnUserId !== currentUserId) {
        const res = await getLudoGame();
        if (res.success && res.data?.state && isSubscribed) {
          setState(res.data.state);
          if (res.data.state.winnerUserId) {
            playVictorySound();
            triggerCelebration({ type: "hearts", count: 40 });
          }
        }
      }
    };

    const interval = setInterval(pollGame, 1000);

    const handleSync = () => {
      if (document.visibilityState === "visible") {
        pollGame();
      }
    };

    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [gameId, state?.mode, state?.status, state?.turnUserId, currentUserId]);

  // Capture alert trigger when partner or user kills a pawn
  useEffect(() => {
    if (state?.lastCapture?.timestamp) {
      if (Date.now() - state.lastCapture.timestamp < 10000) {
        setCaptureAlert({ killer: state.lastCapture.killerName, victim: state.lastCapture.victimName });
        playCaptureSound();
        triggerHaptic("heartbeat");
        triggerCelebration({ type: "hearts", count: 35 });
        const timer = setTimeout(() => setCaptureAlert(null), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [state?.lastCapture?.timestamp]);

  const handleStartGame = async () => {
    setLoading(true);
    playStepSound();
    try {
      const res = await startLudoGame(selectedMode, selectedStake, selectedPawnCount);
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
    playDiceRollSound();
    triggerHaptic("medium");
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
    if (!gameId || !state || !state.dice || animatingPawn) return;
    const pawn = state.pawns[pawnId];
    if (!pawn) return;

    const roll = state.dice;
    const isP1 = state.turnUserId === state.player1.id;
    const playerNum: 1 | 2 = isP1 ? 1 : 2;
    const pawnIndex = parseInt(pawnId.split("_")[1], 10) || 0;

    // 1. Hatching from yard
    if (pawn.stepCount === -1) {
      playStepSound();
      triggerHaptic("selection");
      try {
        const res = await moveLudoPawn(gameId, pawnId);
        if (res.success && res.state) {
          setState(res.state);
        }
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // 2. Step-by-step authentic hopping animation
    const startStep = pawn.stepCount;
    const endStep = startStep + roll;

    for (let step = startStep + 1; step <= endStep; step++) {
      await new Promise((resolve) => setTimeout(resolve, 110));
      const coord = getCoordForStep(playerNum, step, pawnIndex);
      setAnimatingPawn({ id: pawnId, col: coord.col, row: coord.row });
      playStepSound();
      triggerHaptic("light");
    }

    await new Promise((resolve) => setTimeout(resolve, 60));
    setAnimatingPawn(null);

    try {
      const res = await moveLudoPawn(gameId, pawnId);
      if (res.success && res.state) {
        setState(res.state);

        if (res.won) {
          playVictorySound();
          triggerHaptic("sparkUnlock");
          triggerCelebration({ type: "hearts", count: 60 });
        } else if (res.captured) {
          playCaptureSound();
          triggerHaptic("heartbeat");
          triggerCelebration({ type: "hearts", count: 35 });
        } else if (endStep === 56) {
          playHomeSound();
          triggerCelebration({ type: "hearts", count: 20 });
        } else {
          triggerHaptic("selection");
        }
      }
    } catch (err) {
      console.error(err);
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
              Ludo
            </h1>
            <p className="text-sm text-[#685E58] max-w-xs mx-auto">
              A 2-player board race. Roll dice, advance your pawns to the Home triangle, and capture each other&apos;s tokens!
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

          {/* Token Count Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A49B94]">
              Token Count
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPawnCount(4)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPawnCount === 4
                    ? "bg-[#FCEBEE] border-[#E06D75] text-[#BA3F4A] ring-2 ring-[#E06D75]/20 font-bold shadow-xs"
                    : "bg-white border-[#EAE6DE] text-[#1E1A18]"
                }`}
              >
                <div className="text-xs font-bold">4 Tokens (Classic Ludo) 🎯</div>
                <div className="text-[10px] text-[#756963] font-normal mt-0.5">Full traditional experience</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPawnCount(2)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPawnCount === 2
                    ? "bg-[#FCEBEE] border-[#E06D75] text-[#BA3F4A] ring-2 ring-[#E06D75]/20 font-bold shadow-xs"
                    : "bg-white border-[#EAE6DE] text-[#1E1A18]"
                }`}
              >
                <div className="text-xs font-bold">2 Tokens (Fast Race) ⚡</div>
                <div className="text-[10px] text-[#756963] font-normal mt-0.5">Quick couple match (~5 mins)</div>
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
            {loading ? "Preparing Board..." : "Start Ludo Match 🎲"}
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
    <div className="flex flex-col min-h-screen bg-[#FAF7F2] max-w-lg mx-auto justify-between p-3 pb-8 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/home"
          className="text-xs font-semibold text-[#685E58] hover:text-[#1E1A18] flex items-center gap-1"
        >
          ← Exit
        </Link>

        <div className="flex items-center gap-2">
          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="px-2.5 py-1 rounded-full bg-white border border-[#EAE6DE] text-[11px] font-semibold text-[#1E1A18] shadow-2xs hover:bg-[#FDFBF7] cursor-pointer"
            title="Toggle Sound Effects"
          >
            {soundOn ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>

          {state.stakePoints > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#FFFBF0] border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold">
              Pot: {state.stakePoints * 2} pts
            </span>
          )}

          <button
            type="button"
            onClick={handleAbandon}
            className="text-[11px] text-[#A49B94] hover:text-[#BA3F4A] cursor-pointer"
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
          <div className="flex items-center gap-2 min-w-0">
            <Avatar avatar={state.player1.avatar} name={state.player1.name} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1E1A18] truncate">
                {state.player1.name}
              </div>
              <div className="text-[10px] text-[#BA3F4A] font-semibold">
                {isP1 ? "✦ Turn to move" : "P1 (Red)"}
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
          <div className="flex items-center gap-2 min-w-0">
            <Avatar avatar={state.player2.avatar} name={state.player2.name} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#1E1A18] truncate">
                {state.player2.name}
              </div>
              <div className="text-[10px] text-[#D4AF37] font-semibold">
                {!isP1 ? "✦ Turn to move" : "P2 (Yellow)"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dramatic Capture Banner Alert */}
      {captureAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm px-4 py-3 rounded-2xl bg-linear-to-r from-[#991B1B] to-[#E06D75] text-white shadow-2xl border border-white/20 animate-in slide-in-from-top duration-300 flex items-center gap-3">
          <span className="text-3xl animate-bounce">⚔️</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-200">
              Token Captured! 💋
            </div>
            <div className="text-xs font-semibold leading-tight text-white truncate">
              <strong>{captureAlert.killer}</strong> sent <strong>{captureAlert.victim}</strong> back to Yard!
            </div>
          </div>
        </div>
      )}

      {/* The 2-Player Ludo Board */}
      <div className="my-auto py-1">
        <LudoBoard
          pawns={state.pawns}
          movablePawnIds={state.movablePawnIds}
          pawnCount={state.pawnCount || 4}
          player1={state.player1}
          player2={state.player2}
          turnUserId={state.turnUserId}
          hasRolled={state.hasRolled}
          diceValue={state.dice}
          animatingPawn={animatingPawn}
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

        {/* Quick Tap-To-Advance Button when a single pawn is movable or all movable are in yard */}
        {isMyTurn &&
          state.hasRolled &&
          state.movablePawnIds.length > 0 &&
          (state.movablePawnIds.length === 1 ||
            state.movablePawnIds.every((pid) => state.pawns[pid]?.stepCount === -1)) && (
            <button
              type="button"
              onClick={() => handleMovePawn(state.movablePawnIds[0])}
              className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-[#E06D75] to-[#B43A47] text-white text-xs font-bold shadow-lg shadow-[#E06D75]/30 active:scale-98 transition-all flex items-center justify-center gap-2 animate-pulse cursor-pointer hover:brightness-105"
            >
              <span>🚀</span>
              <span>
                {state.pawns[state.movablePawnIds[0]]?.stepCount === -1
                  ? "Tap to open token onto the board!"
                  : `Tap to advance token forward ${state.dice} steps!`}
              </span>
              <span>→</span>
            </button>
          )}

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
