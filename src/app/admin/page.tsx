import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPointsBalance, getPointsHistory } from "@/actions/points";
import { getRewards } from "@/actions/rewards";
import { getOrders } from "@/actions/orders";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ToastProvider } from "@/components/shared/Toast";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Girlfriend cannot access Mahesh's admin controls - send back to Her shop
  if (session.role !== "admin") {
    redirect("/");
  }

  const points = await getPointsBalance("user_girlfriend");
  const rewards = await getRewards();
  const orders = await getOrders();
  const history = await getPointsHistory("user_girlfriend");

  return (
    <ToastProvider>
      <div className="min-h-screen bg-warm-canvas p-3 sm:p-6 lg:p-8 flex items-center justify-center">
        <AdminLayout
          initialPoints={points}
          initialRewards={rewards}
          initialOrders={orders}
          initialHistory={history}
          isStandalone={true}
        />
      </div>
    </ToastProvider>
  );
}
