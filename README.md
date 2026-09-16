# Pairly — Our Little Reward Shop

> A private relationship app for two. Small things you do for each other. Little rewards to look forward to.

**Pairly Concept**:
Do something for each other → earn points → choose a reward → send a wish → partner responds → reward happens.

---

## ✨ Features

- **Private Space for Two**: Exactly two people connected with an invite code. Equal partners, no admins, no competition.
- **Tasks & Habits**: Complete daily or one-off tasks given by your partner to earn points.
- **Reward Catalog**: Pick from loving treats, dates, food, and fun rewards offered by your partner.
- **Wish Bar & Review**: Select rewards, review your points summary, add a loving note, and send wishes.
- **Point Reservation System**: Points are safely reserved upon sending a wish, and spent upon approval or released on decline/cancellation.
- **Direct Fulfillment**: One-click fulfillment for simple everyday treats (`Mark Fulfilled ❤️`).
- **Couple Streak**: Track how many consecutive days you both show up for each other.
- **Our Little Timeline**: A private activity feed of completed tasks and fulfilled wishes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript & React 19
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Google OAuth
- **Styling**: Tailwind CSS v4 (*Velvet & Keepsake* warm aesthetic)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mahe-gi/little-reward-shop.git
cd little-reward-shop
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your secrets:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/pairly`)
- `BETTER_AUTH_SECRET`: Secret key for session encryption
- `BETTER_AUTH_URL`: App URL (`http://localhost:3000`)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials

### 3. Start Database & Run Migrations
Using Docker:
```bash
docker compose up -d
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
