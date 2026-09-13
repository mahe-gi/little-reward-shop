import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import {
  INITIAL_USERS,
  INITIAL_POINTS_TRANSACTION,
  INITIAL_REWARDS,
} from "@/db/seed-data";

async function main() {
  console.log("🧹 Clearing all tables in database...");
  const db = getDb();

  // Clear in child-to-parent order to respect foreign key constraints
  await db.delete(schema.cartItems);
  console.log("  ✓ Cleared cart_items");

  await db.delete(schema.fulfillmentItems);
  console.log("  ✓ Cleared fulfillment_items");

  await db.delete(schema.redemptionItems);
  console.log("  ✓ Cleared redemption_items");

  await db.delete(schema.redemptionOrders);
  console.log("  ✓ Cleared redemption_orders");

  await db.delete(schema.pointTransactions);
  console.log("  ✓ Cleared point_transactions");

  await db.delete(schema.rewards);
  console.log("  ✓ Cleared rewards");

  await db.delete(schema.users);
  console.log("  ✓ Cleared users");

  console.log("\n🌱 Seeding fresh initial data...");

  // 1. Initial Users
  for (const u of INITIAL_USERS) {
    await db.insert(schema.users).values({
      id: u.id,
      name: u.name,
      role: u.role,
    });
  }
  console.log(`  ✓ Inserted ${INITIAL_USERS.length} users (Her & Mahesh)`);

  // 2. Initial Points Transaction (+10 starting points)
  await db.insert(schema.pointTransactions).values({
    id: INITIAL_POINTS_TRANSACTION.id,
    userId: INITIAL_POINTS_TRANSACTION.userId,
    amount: INITIAL_POINTS_TRANSACTION.amount,
    type: INITIAL_POINTS_TRANSACTION.type,
    reason: INITIAL_POINTS_TRANSACTION.reason,
  });
  console.log("  ✓ Inserted initial starting balance (+10 points for Her)");

  // 3. Initial Rewards
  for (const r of INITIAL_REWARDS) {
    await db.insert(schema.rewards).values({
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
    });
  }
  console.log(`  ✓ Inserted ${INITIAL_REWARDS.length} default catalog rewards`);

  console.log("\n✨ Database reset complete! Database is fresh as a brand new app.\n");

  if (global._pgPool) {
    await global._pgPool.end();
  }
}

main().catch((err) => {
  console.error("❌ Reset error:", err);
  process.exit(1);
});
