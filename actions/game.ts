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
  SAFE_TILES,
  LEAP_TILES,
} from "@/lib/ludo-types";
export type { PawnState, LudoDare, LudoGameState };

function getTileForStep(playerNum: 1 | 2, stepCount: number): number {
  if (stepCount < 0 || stepCount >= 20) return -1;
  if (playerNum === 1) return stepCount;
  return (10 + stepCount) % 20;
}

function calculateMovablePawns(
  playerNum: 1 | 2,
  userId: string,
  roll: number,
  pawns: Record<string, PawnState>
): string[] {
  const prefix = playerNum === 1 ? "p1_" : "p2_";
  const pawnIds = [`${prefix}0`, `${prefix}1`];
  const movable: string[] = [];

  for (const pid of pawnIds) {
    const p = pawns[pid];
    if (!p) continue;

    // Pawn is in base yard
    if (p.stepCount === -1) {
      // Rolling 6 (or 1 in couple quick play) hatches pawn
      if (roll === 6 || roll === 1) {
        movable.push(pid);
      }
    } else if (p.stepCount < 23) {
      // Pawn is on board or home stretch
      if (p.stepCount + roll <= 23) {
        movable.push(pid);
      }
    }
  }

  return movable;
}

let tableEnsured = false;

async function ensureCoupleGameTable() {
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
  stakePoints: number = 0
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

    // Cancel any previous active games
    await prisma.coupleGame.updateMany({
      where: {
        coupleId: couple.id,
        gameType: "LUDO",
        status: "ACTIVE",
      },
      data: { status: "ABANDONED" },
    });

    const initialPawns: Record<string, PawnState> = {
      p1_0: { id: "p1_0", ownerId: user.id, stepCount: -1, position: -1 },
      p1_1: { id: "p1_1", ownerId: user.id, stepCount: -1, position: -1 },
      p2_0: { id: "p2_0", ownerId: partner.id, stepCount: -1, position: -1 },
      p2_1: { id: "p2_1", ownerId: partner.id, stepCount: -1, position: -1 },
    };

    const initialState: LudoGameState = {
      mode,
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
      lastActionMessage: `${user.name} started a new match of Love Ludo! Roll the dice to begin 🎲`,
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

    // Notify partner if remote
    if (mode === "remote") {
      await sendPushNotification(partner.id, {
        title: "Love Ludo Match! 🎲",
        body: `${user.name} challenged you to a game of Love Ludo!`,
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

    // Remote turn enforcement: only current turn player can roll
    if (state.mode === "remote" && state.turnUserId !== user.id) {
      return { success: false, error: "It's your partner's turn to roll." };
    }

    if (state.hasRolled) {
      return { success: false, error: "You already rolled! Please select a pawn to move." };
    }

    // Roll standard 1-6
    const roll = Math.floor(Math.random() * 6) + 1;
    const isPlayer1 = state.turnUserId === state.player1.id;
    const playerNum = isPlayer1 ? 1 : 2;
    const currentName = isPlayer1 ? state.player1.name : state.player2.name;

    const movable = calculateMovablePawns(playerNum, state.turnUserId, roll, state.pawns);

    state.dice = roll;
    state.hasRolled = true;
    state.activeDare = null;
    state.movablePawnIds = movable;

    if (movable.length === 0) {
      // No legal moves: pass turn to other player (unless rolled 6)
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
      state.lastActionMessage = `${currentName} rolled a ${roll}! Tap a pawn to move ✨`;
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
    let hitLeap = false;
    let triggeredDare: LudoDare | null = null;
    const roll = state.dice;

    if (pawn.stepCount === -1) {
      // Hatching pawn from base
      pawn.stepCount = 0;
      pawn.position = getTileForStep(playerNum, 0);
      state.lastActionMessage = `${currentName} hatched a pawn to the track! 🚀`;
    } else {
      // Moving active pawn
      let newStep = pawn.stepCount + roll;

      // Check Leap bonus if landing on leap tile (steps < 20)
      if (newStep < 20) {
        const intermediateTile = getTileForStep(playerNum, newStep);
        if (LEAP_TILES.includes(intermediateTile)) {
          newStep = Math.min(23, newStep + 2);
          hitLeap = true;
        }
      }

      pawn.stepCount = newStep;
      pawn.position = newStep < 20 ? getTileForStep(playerNum, newStep) : -1;

      // Check capture on opponent's pawns
      if (pawn.stepCount < 20) {
        const curTile = pawn.position;
        if (!SAFE_TILES.includes(curTile)) {
          const oppPrefix = isPlayer1 ? "p2_" : "p1_";
          for (const oppPawnId of [`${oppPrefix}0`, `${oppPrefix}1`]) {
            const oppPawn = state.pawns[oppPawnId];
            if (oppPawn && oppPawn.stepCount >= 0 && oppPawn.stepCount < 20 && oppPawn.position === curTile) {
              // Send opponent pawn back to base yard!
              oppPawn.stepCount = -1;
              oppPawn.position = -1;
              captured = true;
            }
          }
        }

        // Check Dare Tile
        if (LOVE_DARES[curTile]) {
          triggeredDare = LOVE_DARES[curTile];
          state.activeDare = triggeredDare;
        }
      }

      if (pawn.stepCount === 23) {
        state.lastActionMessage = `${currentName}'s pawn reached the Home Heart! 💖`;
      } else if (captured) {
        state.lastActionMessage = `${currentName} caught ${otherName}'s pawn with a playful kiss! Back to base! 💋`;
      } else if (hitLeap) {
        state.lastActionMessage = `${currentName} landed on Cupid's Leap! Jumped +2 steps ⚡`;
      } else {
        state.lastActionMessage = `${currentName} moved pawn forward ${roll} steps ✨`;
      }
    }

    // Check Win Condition: both pawns at stepCount === 23
    const prefix = isPlayer1 ? "p1_" : "p2_";
    const p0 = state.pawns[`${prefix}0`];
    const p1 = state.pawns[`${prefix}1`];
    const hasWon = p0.stepCount === 23 && p1.stepCount === 23;

    if (hasWon) {
      state.winnerUserId = state.turnUserId;
      state.lastActionMessage = `🎉 ${currentName} won the match of Love Ludo! 💖`;

      // Handle Stake Payout if points were staked
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
              description: `Won Love Ludo Match pot (+${totalPot} pts)!`,
            },
          });

          await tx.activity.create({
            data: {
              coupleId: couple.id,
              actorUserId: state.turnUserId,
              type: "TASK_COMPLETED",
              description: `${currentName} won the Love Ludo match and earned +${totalPot} pts! 🎲`,
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
          title: "Love Ludo Match Finished! 🏆",
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

    // Turn passing logic:
    // Bonus turn if rolled 6, captured opponent, or reached home
    const gotBonusRoll = roll === 6 || captured || pawn.stepCount === 23;

    if (gotBonusRoll) {
      state.hasRolled = false;
      state.dice = null;
      state.movablePawnIds = [];
      state.lastActionMessage += " Bonus roll! 🎲";
    } else {
      // Pass turn to next player
      state.hasRolled = false;
      state.dice = null;
      state.movablePawnIds = [];
      const nextUserId = isPlayer1 ? state.player2.id : state.player1.id;
      state.turnUserId = nextUserId;
      const nextName = isPlayer1 ? state.player2.name : state.player1.name;
      state.lastActionMessage += ` Now it's ${nextName}'s turn!`;
    }

    state.updatedAt = new Date().toISOString();

    await prisma.coupleGame.update({
      where: { id: gameId },
      data: {
        turnUserId: state.turnUserId,
        state: state as unknown as object,
      },
    });

    // If remote mode, alert partner when it becomes their turn
    if (state.mode === "remote" && !gotBonusRoll && partner) {
      await sendPushNotification(state.turnUserId, {
        title: "Your Turn in Love Ludo! 🎲",
        body: `${currentName} just moved. Tap to roll your dice!`,
      }).catch(() => {});
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
