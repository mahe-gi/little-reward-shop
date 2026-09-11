export type UserRole = "girlfriend" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type PointTransactionType =
  | "earned"
  | "bonus"
  | "adjustment"
  | "redemption"
  | "refund";

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: PointTransactionType;
  reason: string;
  orderId?: string | null;
  createdAt: string;
}

export type RewardCategory =
  | "All"
  | "Little Things"
  | "Treats"
  | "Experiences"
  | "Special";

export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  emoji: string;
  category: RewardCategory;
  featured: boolean;
  active: boolean;
  fulfillmentInstructions?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "fulfilling"
  | "completed"
  | "rejected";

export interface RedemptionItem {
  id: string;
  orderId: string;
  rewardId: string;
  titleSnapshot: string;
  descriptionSnapshot: string;
  pointsSnapshot: number;
  quantity: number;
  createdAt: string;
}

export interface FulfillmentItem {
  id: string;
  orderId: string;
  redemptionItemId?: string | null;
  label: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface RedemptionOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalPoints: number;
  note?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
  items: RedemptionItem[];
  fulfillmentItems: FulfillmentItem[];
}

export interface CartItem {
  rewardId: string;
  title: string;
  description: string;
  points: number;
  emoji: string;
  quantity: number;
}
