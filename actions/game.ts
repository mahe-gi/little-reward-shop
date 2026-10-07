"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";
import { sendPushNotification } from "@/lib/push";
import {
  PawnState,
  LudoDare,
  LudoGameState,
  LOVE_DARES,
  CLASSIC_SAFE_TILES,
  getTrackTileForStep,
} from "@/lib/ludo-types";

export type { PawnState, LudoDare, LudoGameState };

function calculateMovablePawns(
  playerNum: 1 | 2,
  pawnCount: number,
  roll: number,
  pawns: Record<string, PawnState>
): string[] {
  const prefix = playerNum === 1 ? "p1_" : "p2_";
  const pawnIds = Array.from({ length: pawnCount }, (_, i) => `${prefix}${i}`);
  const movable: string[] = [];

  for (const pid of pawnIds) {
    const p = pawns[pid];
    if (!p) continue;

    // Pawn is in Base Yard - only a 6 opens it!
    if (p.stepCount === -1) {
      if (roll === 6) {
        movable.push(pid);
      }
    } else if (p.stepCount < 56) {
      // Exact roll needed to enter Home (step 56)
      if (p.stepCount + roll <= 56) {
        movable.push(pid);
      }
    }
  }

  return movable;
}

let tableEnsured = false;

export async function ensureCoupleGameTable() {
  if (tableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "couple_game" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "coupleId" TEXT NOT NULL REFERENCES "couple"("id") ON DELETE CASCADE,
        "gameType" TEXT NOT NULL DEFAULT 'LUDO',
        "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
        "turnUserId" TEXT NOT NULL,
        "stakePoints" INTEGER NOT NULL DEFAULT 0,
        "winnerUserId" TEXT,
        "state" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "couple_game_coupleId_status_idx" ON "couple_game"("coupleId", "status");
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("[Ludo] ensureCoupleGameTable:", err);
  }
}

export async function getLudoGame(): Promise<{
  success: boolean;
  data?: {
    gameId: string | null;
    state: LudoGameState | null;
    currentUserId: string;
    partnerId: string;
    userBalance: number;
  };
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();
    if (!partner) {
      return { success: false, error: "You must be paired with a partner to play." };
    }

    await ensureCoupleGameTable();

    const activeGame = await prisma.coupleGame.findFirst({
      where: {
        coupleId: couple.id,
        gameType: "LUDO",
        status: "ACTIVE",
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: {
        gameId: activeGame ? activeGame.id : null,
        state: activeGame ? (activeGame.state as unknown as LudoGameState) : null,
        currentUserId: user.id,
        partnerId: partner.id,
        userBalance: user.pointBalance,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load game";
    return { success: false, error: msg };
  }
}

export async function startLudoGame(
  mode: "couch" | "remote" = "couch",
  stakePoints: number = 0,
  pawnCount: 2 | 4 = 4
): Promise<{
  success: boolean;
  gameId?: string;
  state?: LudoGameState;
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();
    if (!partner) {
      return { success: false, error: "Both partners must be connected to start a match." };
    }

    const validStakes = [0, 5, 10];
    const stake = validStakes.includes(stakePoints) ? stakePoints : 0;

    if (stake > 0 && user.pointBalance < stake) {
      return {
        success: false,
        error: `You need at least ${stake} points to start a staked match.`,
      };
    }

    await ensureCoupleGameTable();

    // Cancel previous active games
    await prisma.coupleGame.updateMany({
      where: {
        coupleId: couple.id,
        gameType: "LUDO",
        status: "ACTIVE",
      },
      data: { status: "ABANDONED" },
    });

    const count = pawnCount === 2 ? 2 : 4;
    const initialPawns: Record<string, PawnState> = {};

    for (let i = 0; i < count; i++) {
      initialPawns[`p1_${i}`] = { id: `p1_${i}`, ownerId: user.id, stepCount: -1, position: -1 };
      initialPawns[`p2_${i}`] = { id: `p2_${i}`, ownerId: partner.id, stepCount: -1, position: -1 };
    }

    const initialState: LudoGameState = {
      mode,
      pawnCount: count,
      player1: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        color: "rose",
      },
      player2: {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatar,
        color: "gold",
      },
      turnUserId: user.id,
      dice: null,
      hasRolled: false,
      consecutiveSixes: 0,
      movablePawnIds: [],
      pawns: initialPawns,
      lastActionMessage: `${user.name} started a match of Classic Ludo! Roll a 6 to open your token 🎲`,
      activeDare: null,
      winnerUserId: null,
      status: "ACTIVE",
      stakePoints: stake,
      updatedAt: new Date().toISOString(),
    };

    const newGame = await prisma.coupleGame.create({
      data: {
        coupleId: couple.id,
        gameType: "LUDO",
        status: "ACTIVE",
        turnUserId: user.id,
        stakePoints: stake,
        state: initialState as unknown as object,
      },
    });

    if (mode === "remote") {
      await sendPushNotification(partner.id, {
        title: "Classic Ludo Match! 🎲",
        body: `${user.name} challenged you to a game of Ludo!`,
      }).catch(() => {});
    }

    revalidatePath("/game/ludo");
    revalidatePath("/home");

    return {
      success: true,
      gameId: newGame.id,
      state: initialState,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to start game";
    return { success: false, error: msg };
  }
}

export async function rollLudoDice(gameId: string): Promise<{
  success: boolean;
  state?: LudoGameState;
  dice?: number;
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();
    const game = await prisma.coupleGame.findUnique({
      where: { id: gameId },
    });

    if (!game || game.status !== "ACTIVE" || game.coupleId !== couple.id) {
      return { success: false, error: "Active game not found." };
    }

    const state = game.state as unknown as LudoGameState;

    if (state.mode === "remote" && state.turnUserId !== user.id) {
      return { success: false, error: "It's your partner's turn to roll." };
    }

    if (state.hasRolled) {
      return { success: false, error: "You already rolled! Please select a pawn to move." };
    }

    const isPlayer1 = state.turnUserId === state.player1.id;
    const playerNum = isPlayer1 ? 1 : 2;
    const currentName = isPlayer1 ? state.player1.name : state.player2.name;
    const prefix = isPlayer1 ? "p1_" : "p2_";
    const count = state.pawnCount || 4;

    // Check if player has all pawns stuck in the yard
    const myPawns = Array.from({ length: count }, (_, i) => state.pawns[`${prefix}${i}`]).filter(Boolean);
    const allInYard = myPawns.length > 0 && myPawns.every((p) => p.stepCount === -1);

    if (!state.turnsWithoutSix) {
      state.turnsWithoutSix = {};
    }
    const misses = state.turnsWithoutSix[state.turnUserId] || 0;

    // Pity balancing:
    // If a player has all pawns in yard and hasn't rolled a 6:
    // - 1st miss: 40% chance of 6
    // - 2nd miss: 75% chance of 6
    // - 3rd miss+: 100% guaranteed 6 (no player is left trapped for 4 turns!)
    // If not all in yard, but player hasn't rolled a 6 for 5+ turns: 35% chance of 6
    let roll: number;
    let forceSix = false;

    if (allInYard) {
      if (misses >= 3) {
        forceSix = true;
      } else if (misses === 2) {
        forceSix = Math.random() < 0.75;
      } else if (misses === 1) {
        forceSix = Math.random() < 0.4;
      }
    } else if (misses >= 5) {
      forceSix = Math.random() < 0.35;
    }

    if (forceSix) {
      roll = 6;
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    // Track consecutive sixes and pity counter
    if (roll === 6) {
      state.turnsWithoutSix[state.turnUserId] = 0;
      state.consecutiveSixes = (state.consecutiveSixes || 0) + 1;
    } else {
      state.turnsWithoutSix[state.turnUserId] = misses + 1;
      state.consecutiveSixes = 0;
    }

    if (state.consecutiveSixes >= 3) {
      // 3rd six forfeits turn
      state.consecutiveSixes = 0;
      state.hasRolled = false;
      state.dice = 6;
      state.movablePawnIds = [];
      const nextUserId = isPlayer1 ? state.player2.id : state.player1.id;
      const nextName = isPlayer1 ? state.player2.name : state.player1.name;
      state.turnUserId = nextUserId;
      state.lastActionMessage = `${currentName} rolled 3 sixes in a row! Turn forfeited to ${nextName} 😅`;
    } else {
      const movable = calculateMovablePawns(playerNum, state.pawnCount || 4, roll, state.pawns);

      state.dice = roll;
      state.hasRolled = true;
      state.activeDare = null;
      state.movablePawnIds = movable;

      if (movable.length === 0) {
        state.hasRolled = false;
        state.movablePawnIds = [];

        if (roll === 6) {
          state.lastActionMessage = `${currentName} rolled a 6, but has no valid moves. Bonus roll! 🎲`;
        } else {
          const nextUserId = isPlayer1 ? state.player2.id : state.player1.id;
          const nextName = isPlayer1 ? state.player2.name : state.player1.name;
          state.turnUserId = nextUserId;
          state.lastActionMessage = `${currentName} rolled a ${roll} (no moves). Turn passes to ${nextName} ✨`;
        }
      } else {
        if (roll === 6) {
          state.lastActionMessage = `🎉 ${currentName} rolled a 6! Tap to open a token or move ahead ✨`;
        } else {
          state.lastActionMessage = `${currentName} rolled a ${roll}! Tap a token to move ✨`;
        }
      }
    }

    state.updatedAt = new Date().toISOString();

    await prisma.coupleGame.update({
      where: { id: gameId },
      data: {
        turnUserId: state.turnUserId,
        state: state as unknown as object,
      },
    });

    return {
      success: true,
      state,
      dice: roll,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to roll dice";
    return { success: false, error: msg };
  }
}

export async function moveLudoPawn(
  gameId: string,
  pawnId: string
): Promise<{
  success: boolean;
  state?: LudoGameState;
  captured?: boolean;
  won?: boolean;
  dare?: LudoDare | null;
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();
    const game = await prisma.coupleGame.findUnique({
      where: { id: gameId },
    });

    if (!game || game.status !== "ACTIVE" || game.coupleId !== couple.id) {
      return { success: false, error: "Active game not found." };
    }

    const state = game.state as unknown as LudoGameState;

    if (!state.hasRolled || !state.dice) {
      return { success: false, error: "Please roll the dice first." };
    }

    if (!state.movablePawnIds.includes(pawnId)) {
      return { success: false, error: "That pawn cannot move with this roll." };
    }

    const isPlayer1 = state.turnUserId === state.player1.id;
    const playerNum = isPlayer1 ? 1 : 2;
    const currentName = isPlayer1 ? state.player1.name : state.player2.name;
    const otherName = isPlayer1 ? state.player2.name : state.player1.name;
    const pawn = state.pawns[pawnId];

    if (!pawn) {
      return { success: false, error: "Pawn not found." };
    }

    let captured = false;
    let triggeredDare: LudoDare | null = null;
    const roll = state.dice;

    if (pawn.stepCount === -1) {
      // Hatch from yard on 6
      pawn.stepCount = 0;
      pawn.position = getTrackTileForStep(playerNum, 0);
      state.lastActionMessage = `${currentName} brought a token onto the board! 🚀`;
    } else {
      const newStep = pawn.stepCount + roll;
      pawn.stepCount = newStep;
      pawn.position = newStep <= 50 ? getTrackTileForStep(playerNum, newStep) : -1;

      // Check capture on 52-tile circuit
      if (newStep <= 50) {
        const curTile = pawn.position;
        if (!CLASSIC_SAFE_TILES.includes(curTile)) {
          const oppPrefix = isPlayer1 ? "p2_" : "p1_";
          const count = state.pawnCount || 4;

          for (let i = 0; i < count; i++) {
            const oppPawn = state.pawns[`${oppPrefix}${i}`];
            if (oppPawn && oppPawn.stepCount >= 0 && oppPawn.stepCount <= 50 && oppPawn.position === curTile) {
              // Capture opponent pawn!
              oppPawn.stepCount = -1;
              oppPawn.position = -1;
              captured = true;
            }
          }

          if (captured) {
            state.lastCapture = {
              killerName: currentName,
              victimName: otherName,
              pawnId,
              timestamp: Date.now(),
            };
          }
        }
      }

      if (pawn.stepCount === 56) {
        state.lastActionMessage = `💖 ${currentName}'s token entered the Home Triangle!`;
      } else if (captured) {
        state.lastActionMessage = `⚔️ ${currentName} captured ${otherName}'s token! Sent back to Yard! 💋`;
      } else {
        state.lastActionMessage = `${currentName} moved token forward ${roll} steps ✨`;
      }
    }

    // Check Win Condition: all pawns of current player reached stepCount === 56
    const prefix = isPlayer1 ? "p1_" : "p2_";
    const count = state.pawnCount || 4;
    const hasWon = Array.from({ length: count }, (_, i) => state.pawns[`${prefix}${i}`]).every(
      (p) => p && p.stepCount === 56
    );

    if (hasWon) {
      state.winnerUserId = state.turnUserId;
      state.lastActionMessage = `🏆 ${currentName} won the match of Classic Ludo! 💖`;

      if (state.stakePoints > 0) {
        const totalPot = state.stakePoints * 2;
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: state.turnUserId },
            data: { pointBalance: { increment: totalPot } },
          });

          await tx.walletTransaction.create({
            data: {
              userId: state.turnUserId,
              amount: totalPot,
              type: "BONUS",
              status: "FINALIZED",
              description: `Won Classic Ludo Match pot (+${totalPot} pts)!`,
            },
          });

          await tx.activity.create({
            data: {
              coupleId: couple.id,
              actorUserId: state.turnUserId,
              type: "TASK_COMPLETED",
              description: `${currentName} won the Classic Ludo match and earned +${totalPot} pts! 🎲`,
            },
          });
        });
      }

      await prisma.coupleGame.update({
        where: { id: gameId },
        data: {
          status: "COMPLETED",
          winnerUserId: state.turnUserId,
          state: state as unknown as object,
        },
      });

      if (partner) {
        await sendPushNotification(partner.id, {
          title: "Ludo Match Finished! 🏆",
          body: `${currentName} won the match! 💖`,
        }).catch(() => {});
      }

      revalidatePath("/game/ludo");
      revalidatePath("/home");

      return {
        success: true,
        state,
        captured,
        won: true,
        dare: triggeredDare,
      };
    }

    // Bonus roll rule: rolled 6, captured opponent, or pawn reached home
    const gotBonusRoll = roll === 6 || captured || pawn.stepCount === 56;

    if (gotBonusRoll) {
      state.hasRolled = false;
      state.dice = null;
      state.movablePawnIds = [];
      state.lastActionMessage += " Bonus roll! 🎲";
    } else {
      state.hasRolled = false;
      state.dice = null;
      state.movablePawnIds = [];
      const nextUserId = isPlayer1 ? state.player2.id : state.player1.id;
      state.turnUserId = nextUserId;
      const nextName = isPlayer1 ? state.player2.name : state.player1.name;
      state.lastActionMessage += ` Turn passes to ${nextName}!`;
    }

    state.updatedAt = new Date().toISOString();

    await prisma.coupleGame.update({
      where: { id: gameId },
      data: {
        turnUserId: state.turnUserId,
        state: state as unknown as object,
      },
    });

    if (partner) {
      if (captured) {
        const victimUserId = isPlayer1 ? state.player2.id : state.player1.id;
        await sendPushNotification(victimUserId, {
          title: "⚔️ Token Captured in Ludo!",
          body: `${currentName} captured your token and sent it back to the Yard! 💋 Time for revenge!`,
        }).catch(() => {});
      } else if (state.mode === "remote" && !gotBonusRoll) {
        await sendPushNotification(state.turnUserId, {
          title: "🎲 Your Turn in Ludo!",
          body: `${currentName} moved ${roll} step${roll > 1 ? "s" : ""}. Tap to roll!`,
        }).catch(() => {});
      }
    }

    return {
      success: true,
      state,
      captured,
      won: false,
      dare: triggeredDare,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to move pawn";
    return { success: false, error: msg };
  }
}

export async function abandonLudoGame(gameId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { couple } = await requireCouple();
    await prisma.coupleGame.updateMany({
      where: {
        id: gameId,
        coupleId: couple.id,
      },
      data: { status: "ABANDONED" },
    });

    revalidatePath("/game/ludo");
    revalidatePath("/home");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to end game";
    return { success: false, error: msg };
  }
}
