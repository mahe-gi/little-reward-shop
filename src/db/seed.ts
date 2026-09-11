import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  INITIAL_USERS,
  INITIAL_POINTS_TRANSACTION,
  INITIAL_REWARDS,
} from "./seed-data";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL || process.argv[2];
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Cannot seed Neon database.");
    process.exit(1);
  }

  console.log("Connecting to Neon database...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Seeding users...");
  for (const u of INITIAL_USERS) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        name: u.name,
        role: u.role,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding initial points transaction (+10 points)...");
  await db
    .insert(schema.pointTransactions)
    .values({
      id: INITIAL_POINTS_TRANSACTION.id,
      userId: INITIAL_POINTS_TRANSACTION.userId,
      amount: INITIAL_POINTS_TRANSACTION.amount,
      type: INITIAL_POINTS_TRANSACTION.type,
      reason: INITIAL_POINTS_TRANSACTION.reason,
    })
    .onConflictDoNothing();

  console.log("Seeding 10 catalog rewards...");
  for (const r of INITIAL_REWARDS) {
    await db
      .insert(schema.rewards)
      .values({
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
      })
      .onConflictDoNothing();
  }

  console.log("Seeding completed successfully! ❤️");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
