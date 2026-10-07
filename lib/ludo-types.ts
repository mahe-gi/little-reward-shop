export interface PawnState {
  id: string; // "p1_0", "p1_1", "p2_0", "p2_1"
  ownerId: string;
  stepCount: number; // -1 = base, 0..19 = loop track, 20..22 = home path, 23 = HOME
  position: number; // tile index on track (0..19), or -1 if in base/home
}

export interface LudoDare {
  tile: number;
  type: "kiss" | "dare" | "whisper" | "compliment";
  title: string;
  description: string;
}

export interface LudoGameState {
  mode: "couch" | "remote";
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
  movablePawnIds: string[];
  pawns: Record<string, PawnState>;
  lastActionMessage: string | null;
  activeDare: LudoDare | null;
  winnerUserId: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  stakePoints: number;
  updatedAt: string;
}

export const LOVE_DARES: Record<number, LudoDare> = {
  4: {
    tile: 4,
    type: "kiss",
    title: "Sweet Kiss 💋",
    description: "Give your partner a gentle kiss on their forehead or cheek right now!",
  },
  14: {
    tile: 14,
    type: "compliment",
    title: "Love Whisper ✨",
    description: "Look your partner in the eyes and tell them one thing you adore about them.",
  },
};

// Safe tiles on the 20-tile track where pawns cannot be captured
export const SAFE_TILES = [0, 5, 10, 15];
// Leap tiles that jump ahead by +2 tiles
export const LEAP_TILES = [8, 18];
