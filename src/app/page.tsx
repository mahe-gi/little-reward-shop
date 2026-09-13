import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getPointsBalance,
  getTodayPointsEarned,
  getRecentEarnedTransactions,
} from "@/actions/points";
import { getRewards } from "@/actions/rewards";
import { getOrders } from "@/actions/orders";
import { getCart } from "@/actions/cart";
import { HerLayout } from "@/components/girlfriend/HerLayout";
import { ToastProvider } from "@/components/shared/Toast";
import { DbNotice } from "@/components/shared/DbNotice";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSession();

  // Require authentication
  if (!session) {
    redirect("/login");
  }

  // If logged in as admin, redirect to admin control center
  if (session.role === "admin") {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const validTabs = ["home", "shop", "cart", "orders"] as const;
  const initialTab = validTabs.includes(params.tab as any)
    ? (params.tab as (typeof validTabs)[number])
    : "home";

  const userId = session.userId || "user_girlfriend";

  // Fetch real database state
  let points = 0;
  let rewards: any[] = [];
  let orders: any[] = [];
  let cart: any[] = [];
  let todayEarned = 0;
  let recentTransactions: any[] = [];

  try {
    const data = await Promise.all([
      getPointsBalance(userId),
      getRewards({ activeOnly: true }),
      getOrders(userId),
      getCart(userId),
      getTodayPointsEarned(userId),
      getRecentEarnedTransactions(userId, 3),
    ]);
    points = data[0];
    rewards = data[1];
    orders = data[2];
    cart = data[3];
    todayEarned = data[4];
    recentTransactions = data[5];
  } catch (error: any) {
    console.error("HomePage database fetch error:", error);
    return <DbNotice error={error?.message || String(error)} role="girlfriend" />;
  }

  return (
    <ToastProvider>
      <HerLayout
        userName={session.name}
        initialPoints={points}
        initialRewards={rewards}
        initialOrders={orders}
        initialCart={cart}
        initialTab={initialTab}
        todayPointsEarned={todayEarned}
        recentTransactions={recentTransactions}
      />
    </ToastProvider>
  );
}
