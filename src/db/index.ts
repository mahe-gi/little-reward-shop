import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import {
  INITIAL_USERS,
  INITIAL_POINTS_TRANSACTION,
  INITIAL_REWARDS,
} from "./seed-data";

export interface LocalDbData {
  users: Array<typeof schema.users.$inferSelect>;
  pointTransactions: Array<typeof schema.pointTransactions.$inferSelect>;
  rewards: Array<typeof schema.rewards.$inferSelect>;
  redemptionOrders: Array<typeof schema.redemptionOrders.$inferSelect>;
  redemptionItems: Array<typeof schema.redemptionItems.$inferSelect>;
  fulfillmentItems: Array<typeof schema.fulfillmentItems.$inferSelect>;
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

function getInitialLocalData(): LocalDbData {
  const now = new Date();
  return {
    users: INITIAL_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      createdAt: now,
      updatedAt: now,
    })),
    pointTransactions: [
      {
        id: INITIAL_POINTS_TRANSACTION.id,
        userId: INITIAL_POINTS_TRANSACTION.userId,
        amount: INITIAL_POINTS_TRANSACTION.amount,
        type: INITIAL_POINTS_TRANSACTION.type,
        reason: INITIAL_POINTS_TRANSACTION.reason,
        orderId: null,
        createdAt: now,
      },
    ],
    rewards: INITIAL_REWARDS.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      points: r.points,
      emoji: r.emoji,
      category: r.category,
      featured: r.featured,
      active: r.active,
      fulfillmentInstructions: r.fulfillmentInstructions,
      sortOrder: r.sortOrder,
      createdAt: now,
      updatedAt: now,
    })),
    redemptionOrders: [
      {
        id: "ord_0006",
        orderNumber: "#0006",
        userId: "user_girlfriend",
        status: "completed",
        totalPoints: 5,
        note: "Movie night with popcorn please! 🍿",
        rejectionReason: null,
        createdAt: new Date(Date.now() - 86400000 * 2),
        approvedAt: new Date(Date.now() - 86400000 * 2 + 3600000),
        completedAt: new Date(Date.now() - 86400000 * 1),
        updatedAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
    redemptionItems: [
      {
        id: "ri_0006_1",
        orderId: "ord_0006",
        rewardId: "rew_5_movie",
        titleSnapshot: "Favorite Movie",
        descriptionSnapshot: "You choose the movie. I'm watching.",
        pointsSnapshot: 5,
        quantity: 1,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    ],
    fulfillmentItems: [
      {
        id: "fi_0006_1",
        orderId: "ord_0006",
        redemptionItemId: "ri_0006_1",
        label: "Let her pick the movie",
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: "fi_0006_2",
        orderId: "ord_0006",
        redemptionItemId: "ri_0006_1",
        label: "Prepare comfy seating and snacks",
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        id: "fi_0006_3",
        orderId: "ord_0006",
        redemptionItemId: "ri_0006_1",
        label: "Watch together with zero complaints",
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  };
}

export function readLocalDb(): LocalDbData {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: Local database fallback is strictly prohibited in production. DATABASE_URL (Neon PostgreSQL) is required."
    );
  }
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initial = getInitialLocalData();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    const parsed = JSON.parse(content);
    // Revive dates
    return {
      users: parsed.users.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      })),
      pointTransactions: parsed.pointTransactions.map((pt: any) => ({
        ...pt,
        createdAt: new Date(pt.createdAt),
      })),
      rewards: parsed.rewards.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })),
      redemptionOrders: parsed.redemptionOrders.map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt),
        approvedAt: o.approvedAt ? new Date(o.approvedAt) : null,
        completedAt: o.completedAt ? new Date(o.completedAt) : null,
        updatedAt: new Date(o.updatedAt),
      })),
      redemptionItems: parsed.redemptionItems.map((ri: any) => ({
        ...ri,
        createdAt: new Date(ri.createdAt),
      })),
      fulfillmentItems: parsed.fulfillmentItems.map((fi: any) => ({
        ...fi,
        completedAt: fi.completedAt ? new Date(fi.completedAt) : null,
      })),
    };
  } catch {
    const initial = getInitialLocalData();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function writeLocalDb(data: LocalDbData): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: Local database write is strictly prohibited in production. DATABASE_URL (Neon PostgreSQL) is required."
    );
  }
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function resetLocalDb(): LocalDbData {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Resetting database is prohibited in production.");
  }
  const initial = getInitialLocalData();
  writeLocalDb(initial);
  return initial;
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (process.env.NODE_ENV === "production") {
    if (!databaseUrl) {
      throw new Error(
        "CRITICAL: DATABASE_URL environment variable is missing in production. Neon PostgreSQL is required."
      );
    }
    const sql = neon(databaseUrl);
    return drizzle(sql, { schema });
  }

  if (databaseUrl) {
    const sql = neon(databaseUrl);
    return drizzle(sql, { schema });
  }

  return null;
}

export const isProduction = process.env.NODE_ENV === "production";
export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
