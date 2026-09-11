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
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **PWA**: Web App Manifest with standalone display and mobile safe-area optimization
- **Deployable to**: [Vercel](https://vercel.com/)

---

## 📦 Features

### 👩‍🦰 Girlfriend Experience (Mobile-First 390×844)
1. **Home**:
   - Personalized greeting and emotional subheading
   - Dominant Points card with animated counter, progress circle, and "+1 earned today" badge
   - "Today's Habit Wins" (+1 Healthy Habit, +1 Morning Walk, +1 8 Hours Sleep)
   - Active in-progress order banner ("Waiting for Mahesh 👀" / "It's happening ❤️")
   - Curated reward recommendations with 1-click "+ Add"
2. **Reward Shop**:
   - Filter by categories: *All*, *Little Things*, *Treats*, *Experiences*, *Special*
   - 2-Column responsive reward card grid
   - Reward details bottom drawer sheet
3. **Cart & Insufficient Points Protection**:
   - Real-time quantity adjustments and item deletion
   - Real-time calculation: Total Needed, Available Balance, Remaining after redeem
   - Dynamic Insufficient Points banner (`"You're X points short 👀"`) disabling checkout if balance is exceeded
   - Optional romantic note for Mahesh
   - **Critical Rule**: Adding items to cart or submitting a request **never** deducts points.
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
   - Boyfriend Quick Actions: +1 Healthy Habit, +1 Morning Walk, Custom Points dialog, Add New Reward
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
   - Session logout and configuration status

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://[user]:[password]@[neon-hostname]/[dbname]?sslmode=require

# Passwords for private 2-person authentication
ADMIN_PASSWORD=your_mahesh_password
GIRLFRIEND_PASSWORD=your_girlfriend_password
```

> **Note on Development vs Production**:
> - In development (`NODE_ENV !== "production"`), the app provides a local database fallback and convenient 1-tap test passcodes (`love123` for Her, `mahesh123` for Mahesh) on the `/login` screen.
> - In production (`NODE_ENV === "production"`), `DATABASE_URL`, `ADMIN_PASSWORD`, and `GIRLFRIEND_PASSWORD` are strictly required and verified at startup.
> - Dedicated route isolation: `/` is strictly for Girlfriend, `/admin` is strictly for Mahesh, and `/login` handles private authentication.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding (Neon PostgreSQL)
When deploying to Neon PostgreSQL, push the schema tables and seed the initial 10 rewards and starting 10 points:
```bash
npm run db:push
npm run db:seed
```

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the app.

---

## 🚢 Production Deployment (Vercel)

1. **Push your code** to GitHub:
   ```bash
   git push origin main
   ```
2. **Import project** in [Vercel](https://vercel.com/):
   - Select the `little-reward-shop` repository.
   - Framework preset: **Next.js**.
3. **Configure Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`: Your pooled Neon connection string (`postgresql://...`).
   - `ADMIN_PASSWORD`: Mahesh's private password.
   - `GIRLFRIEND_PASSWORD`: Her private password.
4. **Deploy**:
   - Vercel automatically runs `npm run build` and deploys the app edge-to-edge.

---

## 🔒 Security & Data Integrity

- **Source of Truth**: All point transactions and order statuses are persisted in Neon PostgreSQL. Available balance is calculated dynamically as $\sum \text{amount}$ from `point_transactions`.
- **Atomic Operations**: Approving an order deducts points and updates the order in a single atomic transaction. Double-approval is guarded against race conditions.
- **Session Security**: Sessions are stored in secure HTTP-only cookies (`httpOnly: true`, `secure: true` in production, `sameSite: "lax"`). Role verification is strictly enforced server-side for all sensitive actions.

---

## 📱 PWA Installation

1. Open the application URL on Safari (iOS) or Chrome (Android).
2. Tap **Share** (iOS) or the three-dot menu (Android).
3. Select **Add to Home Screen**.
4. The application opens in standalone fullscreen mode with custom theme colors and icons, feeling like a native phone app.
