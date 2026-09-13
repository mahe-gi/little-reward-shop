import { sql } from "drizzle-orm";
import { getDb } from "./index";

let _migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseTables(): Promise<void> {
  if (_migrationPromise) {
    return _migrationPromise;
  }

  _migrationPromise = (async () => {
    const db = getDb();

    // 1. Users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Point transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id),
        amount INTEGER NOT NULL,
        type VARCHAR(30) NOT NULL,
        reason TEXT NOT NULL,
        order_id VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 3. Rewards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS rewards (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        points INTEGER NOT NULL,
        emoji VARCHAR(16) NOT NULL,
        category VARCHAR(50) NOT NULL,
        featured BOOLEAN DEFAULT FALSE NOT NULL,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        fulfillment_instructions TEXT,
        sort_order INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 4. Redemption orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS redemption_orders (
        id VARCHAR(64) PRIMARY KEY,
        order_number VARCHAR(20) NOT NULL,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL,
        total_points INTEGER NOT NULL,
        note TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        approved_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 5. Redemption items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS redemption_items (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES redemption_orders(id),
        reward_id VARCHAR(64) NOT NULL,
        title_snapshot VARCHAR(120) NOT NULL,
        description_snapshot TEXT NOT NULL,
        points_snapshot INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 6. Fulfillment items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fulfillment_items (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES redemption_orders(id),
        redemption_item_id VARCHAR(64),
        label TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 7. Cart items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id),
        reward_id VARCHAR(64) NOT NULL REFERENCES rewards(id),
        quantity INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
  })();

  try {
    await _migrationPromise;
  } finally {
    _migrationPromise = null;
  }
}
