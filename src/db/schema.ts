import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'girlfriend' | 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'earned' | 'bonus' | 'adjustment' | 'redemption' | 'refund'
  reason: text("reason").notNull(),
  orderId: varchar("order_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'Little Things' | 'Treats' | 'Experiences' | 'Special'
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  fulfillmentInstructions: text("fulfillment_instructions"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const redemptionOrders = pgTable("redemption_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderNumber: varchar("order_number", { length: 20 }).notNull(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 20 }).notNull(), // 'pending' | 'approved' | 'fulfilling' | 'completed' | 'rejected'
  totalPoints: integer("total_points").notNull(),
  note: text("note"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const redemptionItems = pgTable("redemption_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 })
    .notNull()
    .references(() => redemptionOrders.id),
  rewardId: varchar("reward_id", { length: 64 }).notNull(),
  titleSnapshot: varchar("title_snapshot", { length: 120 }).notNull(),
  descriptionSnapshot: text("description_snapshot").notNull(),
  pointsSnapshot: integer("points_snapshot").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fulfillmentItems = pgTable("fulfillment_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 })
    .notNull()
    .references(() => redemptionOrders.id),
  redemptionItemId: varchar("redemption_item_id", { length: 64 }),
  label: text("label").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
