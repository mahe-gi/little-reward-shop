import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPointsBalance } from "@/actions/points";
import { getRewards } from "@/actions/rewards";
import { getOrders } from "@/actions/orders";
import { HerLayout } from "@/components/girlfriend/HerLayout";
import { ToastProvider } from "@/components/shared/Toast";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  // Require authentication
  if (!session) {
    redirect("/login");
  }

  // If logged in as admin, redirect to admin control center
  if (session.role === "admin") {
    redirect("/admin");
  }

  // Fetch real database state
  const points = await getPointsBalance("user_girlfriend");
  const rewards = await getRewards();
  const orders = await getOrders();

  return (
    <ToastProvider>
      <HerLayout
        initialPoints={points}
        initialRewards={rewards}
        initialOrders={orders}
      />
    </ToastProvider>
  );
}
