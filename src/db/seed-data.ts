export const INITIAL_USERS = [
  {
    id: "user_girlfriend",
    name: "Her",
    role: "girlfriend" as const,
  },
  {
    id: "user_mahesh",
    name: "Mahesh",
    role: "admin" as const,
  },
];

export const INITIAL_POINTS_TRANSACTION = {
  id: "pt_init_10",
  userId: "user_girlfriend",
  amount: 10,
  type: "earned" as const,
  reason: "Starting points ❤️",
};

export const INITIAL_REWARDS: Array<{
  id: string;
  title: string;
  description: string;
  points: number;
  emoji: string;
  category: "Little Things" | "Treats" | "Experiences" | "Special";
  featured: boolean;
  active: boolean;
  fulfillmentInstructions: string;
  sortOrder: number;
}> = [];
