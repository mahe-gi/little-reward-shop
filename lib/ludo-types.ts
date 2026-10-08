export interface PawnState {
  id: string; // "p1_0", "p1_1", "p1_2", "p1_3", "p2_0", ...
  ownerId: string;
  stepCount: number; // -1 = base, 0..50 = track, 51..55 = home stretch, 56 = HOME
  position: number; // track tile index (0..51) or -1 if in base/home stretch
}

export interface LudoDare {
  tile: number;
  type: "kiss" | "dare" | "whisper" | "compliment";
  title: string;
  description: string;
}

export interface CaptureEvent {
  killerName: string;
  victimName: string;
  pawnId: string;
  timestamp: number;
}

export interface LudoGameState {
  mode: "couch" | "remote";
  pawnCount: 2 | 4; // 2 pawns (Fast) or 4 pawns (Classic Full Ludo)
  player1: {
    id: string;
    name: string;
    avatar: string | null;
    color: "rose";
  };
  player2: {
    id: string;
    name: string;
    avatar: string | null;
    color: "gold";
  };
  turnUserId: string;
  dice: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  turnsWithoutSix?: Record<string, number>;
  movablePawnIds: string[];
  pawns: Record<string, PawnState>;
  lastActionMessage: string | null;
  activeDare: LudoDare | null;
  lastCapture?: CaptureEvent | null;
  winnerUserId: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  stakePoints: number;
  updatedAt: string;
}

// 52 common path tiles around the 15x15 classic Ludo board
export const CLASSIC_TRACK_COORDS: { col: number; row: number }[] = [
  // 0..4: Left arm top row going right (Red Start at 0)
  { col: 1, row: 6 }, // 0: Red Start (SAFE ⭐)
  { col: 2, row: 6 }, // 1
  { col: 3, row: 6 }, // 2
  { col: 4, row: 6 }, // 3
  { col: 5, row: 6 }, // 4

  // 5..10: Top arm left column going up
  { col: 6, row: 5 }, // 5
  { col: 6, row: 4 }, // 6
  { col: 6, row: 3 }, // 7
  { col: 6, row: 2 }, // 8: SAFE ⭐
  { col: 6, row: 1 }, // 9
  { col: 6, row: 0 }, // 10

  // 11..12: Across top edge
  { col: 7, row: 0 }, // 11
  { col: 8, row: 0 }, // 12

  // 13..17: Top arm right column going down (Green Start at 13)
  { col: 8, row: 1 }, // 13: Green Start (SAFE ⭐)
  { col: 8, row: 2 }, // 14
  { col: 8, row: 3 }, // 15
  { col: 8, row: 4 }, // 16
  { col: 8, row: 5 }, // 17

  // 18..23: Right arm top row going right
  { col: 9, row: 6 }, // 18
  { col: 10, row: 6 }, // 19
  { col: 11, row: 6 }, // 20
  { col: 12, row: 6 }, // 21: SAFE ⭐
  { col: 13, row: 6 }, // 22
  { col: 14, row: 6 }, // 23

  // 24..25: Down right edge
  { col: 14, row: 7 }, // 24
  { col: 14, row: 8 }, // 25

  // 26..30: Right arm bottom row going left (Yellow Start at 26)
  { col: 13, row: 8 }, // 26: Yellow Start (SAFE ⭐)
  { col: 12, row: 8 }, // 27
  { col: 11, row: 8 }, // 28
  { col: 10, row: 8 }, // 29
  { col: 9, row: 8 }, // 30

  // 31..36: Bottom arm right column going down
  { col: 8, row: 9 }, // 31
  { col: 8, row: 10 }, // 32
  { col: 8, row: 11 }, // 33
  { col: 8, row: 12 }, // 34: SAFE ⭐
  { col: 8, row: 13 }, // 35
  { col: 8, row: 14 }, // 36

  // 37..38: Across bottom edge
  { col: 7, row: 14 }, // 37
  { col: 6, row: 14 }, // 38

  // 39..43: Bottom arm left column going up (Blue Start at 39)
  { col: 6, row: 13 }, // 39: Blue Start (SAFE ⭐)
  { col: 6, row: 12 }, // 40
  { col: 6, row: 11 }, // 41
  { col: 6, row: 10 }, // 42
  { col: 6, row: 9 }, // 43

  // 44..49: Left arm bottom row going left
  { col: 5, row: 8 }, // 44
  { col: 4, row: 8 }, // 45
  { col: 3, row: 8 }, // 46
  { col: 2, row: 8 }, // 47: SAFE ⭐
  { col: 1, row: 8 }, // 48
  { col: 0, row: 8 }, // 49

  // 50..51: Up left edge to complete circuit
  { col: 0, row: 7 }, // 50
  { col: 0, row: 6 }, // 51
];

// 8 classic Star safe squares where pawns cannot be captured
export const CLASSIC_SAFE_TILES = [0, 8, 13, 21, 26, 34, 39, 47];

// Red (Player 1) Home Row coordinates (steps 51..55)
export const P1_HOME_COORDS = [
  { col: 1, row: 7 }, // step 51 (H1)
  { col: 2, row: 7 }, // step 52 (H2)
  { col: 3, row: 7 }, // step 53 (H3)
  { col: 4, row: 7 }, // step 54 (H4)
  { col: 5, row: 7 }, // step 55 (H5)
];

// Yellow (Player 2) Home Row coordinates (steps 51..55)
export const P2_HOME_COORDS = [
  { col: 13, row: 7 }, // step 51 (H1)
  { col: 12, row: 7 }, // step 52 (H2)
  { col: 11, row: 7 }, // step 53 (H3)
  { col: 10, row: 7 }, // step 54 (H4)
  { col: 9, row: 7 }, // step 55 (H5)
];

// Yard nest slots inside Player 1 Yard (Top-Left 6x6, exact circle centers)
export const P1_YARD_SLOTS = [
  { col: 2, row: 2 },
  { col: 4, row: 2 },
  { col: 2, row: 4 },
  { col: 4, row: 4 },
];

// Yard nest slots inside Player 2 Yard (Bottom-Right 6x6, exact circle centers)
export const P2_YARD_SLOTS = [
  { col: 11, row: 11 },
  { col: 13, row: 11 },
  { col: 11, row: 13 },
  { col: 13, row: 13 },
];

// Center Home coordinates
export const CENTER_HOME_COORD = { col: 7, row: 7 };

export function getTrackTileForStep(playerNum: 1 | 2, stepCount: number): number {
  if (stepCount < 0 || stepCount > 50) return -1;
  if (playerNum === 1) return stepCount;
  return (26 + stepCount) % 52;
}

export function getDestinationCoord(
  playerNum: 1 | 2,
  currentStep: number,
  roll: number
): { col: number; row: number } | null {
  if (currentStep === -1) {
    if (roll === 6) {
      const tile = playerNum === 1 ? 0 : 26;
      const c = CLASSIC_TRACK_COORDS[tile];
      return { col: c.col + 0.5, row: c.row + 0.5 };
    }
    return null;
  }
  const targetStep = currentStep + roll;
  if (targetStep > 56) return null;
  if (targetStep <= 50) {
    const tile = getTrackTileForStep(playerNum, targetStep);
    const c = CLASSIC_TRACK_COORDS[tile];
    return { col: c.col + 0.5, row: c.row + 0.5 };
  }
  if (targetStep >= 51 && targetStep <= 55) {
    const homeIdx = targetStep - 51;
    const c = playerNum === 1 ? P1_HOME_COORDS[homeIdx] : P2_HOME_COORDS[homeIdx];
    return { col: c.col + 0.5, row: c.row + 0.5 };
  }
  if (targetStep === 56) {
    return playerNum === 1 ? { col: 6.7, row: 7.5 } : { col: 8.3, row: 7.5 };
  }
  return null;
}

export function getCoordForStep(
  playerNum: 1 | 2,
  stepCount: number,
  pawnIndex: number = 0
): { col: number; row: number } {
  if (stepCount === -1) {
    return playerNum === 1
      ? P1_YARD_SLOTS[pawnIndex] || { col: 2, row: 2 }
      : P2_YARD_SLOTS[pawnIndex] || { col: 11, row: 11 };
  }
  if (stepCount <= 50) {
    const tile = getTrackTileForStep(playerNum, stepCount);
    const c = CLASSIC_TRACK_COORDS[tile];
    return { col: c.col + 0.5, row: c.row + 0.5 };
  }
  if (stepCount >= 51 && stepCount <= 55) {
    const homeIdx = stepCount - 51;
    const c = playerNum === 1 ? P1_HOME_COORDS[homeIdx] : P2_HOME_COORDS[homeIdx];
    return { col: c.col + 0.5, row: c.row + 0.5 };
  }
  // Step 56: Home Triangle Bay
  return playerNum === 1
    ? { col: 6.5 + (pawnIndex % 2) * 0.35, row: 7.3 + Math.floor(pawnIndex / 2) * 0.35 }
    : { col: 8.1 + (pawnIndex % 2) * 0.35, row: 7.3 + Math.floor(pawnIndex / 2) * 0.35 };
}

// Special romantic couple dare tiles on the 52-tile circuit
export const LOVE_DARES: Record<number, LudoDare> = {
  8: {
    tile: 8,
    type: "kiss",
    title: "Sweet Kiss 💋",
    description: "Give your partner a gentle kiss on their cheek right now!",
  },
  21: {
    tile: 21,
    type: "compliment",
    title: "Love Whisper ✨",
    description: "Look your partner in the eyes and tell them one thing you adore about them.",
  },
  34: {
    tile: 34,
    type: "dare",
    title: "Cute Hug 🤗",
    description: "Wrap your arms around your partner for a warm 10-second cuddle!",
  },
  47: {
    tile: 47,
    type: "whisper",
    title: "Secret Whisper 🎙️",
    description: "Whisper your favorite memory with your partner into their ear.",
  },
};
