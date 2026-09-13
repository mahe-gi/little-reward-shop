import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPointsBalance, getPointsHistory } from "@/actions/points";
import { getRewards } from "@/actions/rewards";
import { getOrders } from "@/actions/orders";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ToastProvider } from "@/components/shared/Toast";
import { DbNotice } from "@/components/shared/DbNotice";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Girlfriend cannot access Mahesh's admin controls - send back to Her shop
  if (session.role !== "admin") {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};
  const validTabs = [
    "dashboard",
    "points",
    "rewards",
    "orders",
    "history",
    "settings",
  ] as const;
  const initialTab = validTabs.includes(params.tab as any)
    ? (params.tab as (typeof validTabs)[number])
    : "dashboard";

  let points = 0;
  let rewards: any[] = [];
  let orders: any[] = [];
  let history: any[] = [];

  try {
    const data = await Promise.all([
      getPointsBalance("user_girlfriend"),
      getRewards(),
      getOrders(),
      getPointsHistory("user_girlfriend"),
    ]);
    points = data[0];
    rewards = data[1];
    orders = data[2];
    history = data[3];
  } catch (error: any) {
    console.error("AdminPage database fetch error:", error);
    return <DbNotice error={error?.message || String(error)} role="admin" />;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-warm-canvas p-3 sm:p-6 lg:p-8 flex items-center justify-center">
        <AdminLayout
          initialPoints={points}
          initialRewards={rewards}
          initialOrders={orders}
          initialHistory={history}
          initialTab={initialTab}
          isStandalone={true}
        />
      </div>
    </ToastProvider>
  );
}
