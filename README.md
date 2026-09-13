# Our Little Reward Shop ❤️

A private, relationship-based habit reward web application and Progressive Web App (PWA) built specifically for couples. Faithfully adapted from the Google Stitch project (`16742545838069191814`) adhering to the **Velvet & Keepsake** design system.

---

## 🌹 Design Philosophy & Visual Language

- **Design System**: Velvet & Keepsake
- **Visual Identity**: Warm cream canvas (`#FAF7F2`), alabaster card surfaces (`#FDFBF7`), warm romantic rose accents (`#E06D75`), subtle terracotta (`#D97757`), honey gold details (`#E8A838`), and soft sage indicators (`#7E9F85`).
- **Typography**: Editorial serif headings in *Newsreader*, modern interface text in *Plus Jakarta Sans*.
- **Tactile Details**: Soft pillowy 24px corner cards, pill-shaped controls, debossed wells, and subtle ambient lifts.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Local PostgreSQL via Docker Compose in dev; [Neon](https://neon.tech/) Serverless PostgreSQL in production)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **PWA**: Web App Manifest with standalone display and mobile safe-area optimization
- **Deployable to**: [Vercel](https://vercel.com/)

---

## 📦 Features

### 👩‍🦰 Girlfriend Experience (Mobile-First 390×844)
1. **Home**:
   - Personalized greeting and emotional subheading
   - Dominant Points card with animated counter, progress circle, and real points earned today badge
   - Recent Habit Wins directly loaded from database transactions
   - Active in-progress order banner ("Waiting for approval 👀" / "Approved & locked in! ❤️")
   - Curated reward recommendations with 1-click "+ Add"
2. **Reward Shop**:
   - Filter by categories: *All*, *Little Things*, *Treats*, *Experiences*, *Special*
   - 2-Column responsive reward card grid
   - Reward details bottom drawer sheet
3. **Cart & Insufficient Points Protection**:
   - **Persistent Cart**: Stored in PostgreSQL (`cart_items` table), completely preserved across page refreshes and sessions
   - Real-time quantity adjustments and item deletion
   - Real-time calculation: Total Needed, Available Balance, Remaining after redeem
   - Dynamic Insufficient Points banner (`"You're X points short 👀"`) disabling checkout if balance is exceeded
   - Optional romantic note for Mahesh
   - **Critical Rule**: Adding items to cart or submitting a request **never** deducts points. Points are only deducted upon Mahesh's approval.
4. **Order Confirmation & Success Celebration**:
   - Modal `"Wait... 👀"` confirmation before final request dispatch
   - Emotional success screen with subtle confetti celebration
5. **Orders & Live Timeline**:
   - Order list with status filters (*Pending*, *Approved*, *Completed*)
   - Step-by-step Status Timeline:
     1. Request sent ✓
     2. Approved by Mahesh (Points deducted)
     3. Being fulfilled (Boyfriend in action mode)
     4. Delivered with love ❤️

### 🧔 Mahesh Admin Control Panel (Desktop & Mobile Adaptive)
1. **Dashboard**:
   - 4-Stat Overview: Current Points, Active Rewards, Pending Requests, Completed Count
   - "Needs Your Attention" alert card with one-click Approve / Decline
   - Quick Actions: +1 Healthy Habit, +1 Morning Walk, Custom Points dialog, Add New Reward
   - Recent activity stream
2. **Points Ledger**:
   - Current balance hero and lifetime statistics (Earned vs Redeemed)
   - Give Points modal (Amount, reason, category)
   - Deduct Points modal (with negative balance protection)
   - Chronological audit ledger
3. **Reward Catalog**:
   - Search and category filters
   - Enable / Disable toggles
   - Create Reward modal featuring a **Live Card Preview**
4. **Orders & Fulfillment Checklist**:
   - Pending request review with point deduction confirmation dialog
   - **Atomic approval**: Verifies balance >= order total, deducts points in a database transaction, sets status to approved, and initializes the fulfillment checklist
   - **Interactive Fulfillment Checklist**: Check off items as they are delivered; unlocks the `"Mark Order Completed ❤️"` button once all items are completed
5. **History & Settings**:
   - Audit log of points, redemptions, and order events
   - Dynamic configuration and session logout

---

## 🚀 Environments & Local Development

The project cleanly separates development and production environments with zero mock code. The PostgreSQL database is the single source of truth in all environments.

### Local Development (with Docker Compose)

1. **Start the local PostgreSQL database**:
   ```bash
   docker compose up -d
   ```
   This spins up a local PostgreSQL 16 Alpine container with a persistent volume on port `5432`.

2. **Configure `.env.local`**:
   ```env
   DATABASE_URL=postgresql://rewardshop:rewardshop@localhost:5432/rewardshop?sslmode=disable
   ADMIN_PASSWORD=mahesh123
   GIRLFRIEND_PASSWORD=love123
   NEXT_PUBLIC_APP_NAME="Our Little Reward Shop"
   NEXT_PUBLIC_GIRLFRIEND_NAME="Her"
   NEXT_PUBLIC_MAHESH_NAME="Mahesh"
   ```

3. **Push database schema and seed initial rewards & points**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🚢 Production Deployment (Vercel + Neon)

The app is optimized for seamless deployment to Vercel with Neon Serverless PostgreSQL over HTTP (zero connection pooling overhead on serverless lambdas).

1. **Push your code to GitHub**:
   ```bash
   git push origin main
   ```
   Vercel automatically detects new commits and triggers a build.

2. **Set Environment Variables in Vercel Project Settings**:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (e.g., `postgresql://[user]:[password]@[neon-hostname]/[dbname]?sslmode=require`)
   - `ADMIN_PASSWORD`: Mahesh's secret password
   - `GIRLFRIEND_PASSWORD`: Her secret password
   - `NEXT_PUBLIC_APP_NAME`: (Optional) "Our Little Reward Shop"
   - `NEXT_PUBLIC_GIRLFRIEND_NAME`: (Optional) "Her"
   - `NEXT_PUBLIC_MAHESH_NAME`: (Optional) "Mahesh"

3. **Database Migration & Seed on Neon**:
   To initialize a new Neon database instance, run:
   ```bash
   DATABASE_URL="your-neon-url" npm run db:push
   DATABASE_URL="your-neon-url" npm run db:seed
   ```

---

## 🔒 Security & Data Integrity

- **Database as Sole Source of Truth**: No in-memory or file-based mock fallbacks exist in the codebase. All cart items, points, orders, and rewards are stored directly in PostgreSQL.
- **Cart Persistence**: Cart additions and removals sync immediately to the database, ensuring carts persist across browser refreshes, restarts, and devices.
- **Atomic Operations**: Approving an order deducts points and updates the order in a database transaction. Double-approval is strictly prevented.
- **Session Security**: Authenticated sessions are stored in HTTP-only, secure cookies with strict role-based route isolation (`/` for Girlfriend, `/admin` for Mahesh, `/login` for authentication).
