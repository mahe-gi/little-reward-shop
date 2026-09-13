"use client";

import React, { useState, useEffect } from "react";
import { Reward, RedemptionOrder, PointTransaction, RewardCategory } from "@/types";
import { AdminDashboard } from "./AdminDashboard";
import { AdminPointsLedger } from "./AdminPointsLedger";
import { AdminRewardCatalog } from "./AdminRewardCatalog";
import { AdminOrdersFulfillment } from "./AdminOrdersFulfillment";
import { AdminHistory } from "./AdminHistory";
import { AdminSettings } from "./AdminSettings";
import { givePointsAction, deductPointsAction } from "@/actions/points";
import { createRewardAction, toggleRewardActiveAction } from "@/actions/rewards";
import {
  approveOrderAction,
  rejectOrderAction,
  toggleFulfillmentItemAction,
  completeOrderAction,
} from "@/actions/orders";
import { logoutAction } from "@/actions/auth";
import { useToast } from "@/components/shared/Toast";
import {
  Heart,
  LayoutDashboard,
  Coins,
  Gift,
  Package,
  History,
  Settings,
  UserCheck,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "points"
  | "rewards"
  | "orders"
  | "history"
  | "settings";

interface AdminLayoutProps {
  initialPoints: number;
  initialRewards: Reward[];
  initialOrders: RedemptionOrder[];
  initialHistory: PointTransaction[];
  initialTab?: AdminTab;
  onSwitchToGirlfriend?: () => void;
  isStandalone?: boolean;
}

export function AdminLayout({
  initialPoints,
  initialRewards,
  initialOrders,
  initialHistory,
  initialTab = "dashboard",
  onSwitchToGirlfriend,
  isStandalone = false,
}: AdminLayoutProps) {
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<AdminTab>(initialTab || "dashboard");

  const handleTabChange = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "dashboard") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState({}, "", url.toString());
      try {
        localStorage.setItem("reward_shop_admin_active_tab", tab);
      } catch {}
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get("tab") as AdminTab | null;
        const validTabs: AdminTab[] = [
          "dashboard",
          "points",
          "rewards",
          "orders",
          "history",
          "settings",
        ];

        if (urlTab && validTabs.includes(urlTab)) {
          setCurrentTab(urlTab);
        } else if (!initialTab || initialTab === "dashboard") {
          const saved = localStorage.getItem("reward_shop_admin_active_tab") as AdminTab | null;
          if (saved && validTabs.includes(saved) && saved !== "dashboard") {
            setCurrentTab(saved);
            const url = new URL(window.location.href);
            url.searchParams.set("tab", saved);
            window.history.replaceState({}, "", url.toString());
          }
        }
      } catch {}
    }
  }, [initialTab]);
  const [points, setPoints] = useState(initialPoints);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [orders, setOrders] = useState<RedemptionOrder[]>(initialOrders);
  const [history, setHistory] = useState<PointTransaction[]>(initialHistory);

  const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
  const [isCreateRewardModalOpen, setIsCreateRewardModalOpen] = useState(false);

  // Pending orders count for sidebar badge
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const handleGivePoints = async (amount: number, reason: string) => {
    try {
      const res = await givePointsAction({ amount, reason });
      if (res.success) {
        setPoints(res.balance!);
        setHistory((prev) => [
          {
            id: `pt_${Date.now()}`,
            userId: "user_girlfriend",
            amount,
            type: "earned",
            reason,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        showToast("Points Awarded", `Added +${amount} points for her.`);
      } else {
        showToast("Notice", res.error || "Could not give points.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const handleDeductPoints = async (amount: number, reason: string) => {
    try {
      const res = await deductPointsAction({ amount, reason });
      if (res.success) {
        setPoints(res.balance!);
        setHistory((prev) => [
          {
            id: `pt_${Date.now()}`,
            userId: "user_girlfriend",
            amount: -amount,
            type: "adjustment",
            reason,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        showToast("Points Deducted", `Deducted -${amount} points.`);
      } else {
        showToast("Notice", res.error || "Could not deduct points.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const handleCreateReward = async (data: {
    title: string;
    description: string;
    points: number;
    emoji: string;
    category: RewardCategory;
    featured: boolean;
    fulfillmentInstructions?: string;
  }) => {
    try {
      const res = await createRewardAction(data);
      if (res.success) {
        const newRew: Reward = {
          id: res.rewardId!,
          title: data.title,
          description: data.description,
          points: data.points,
          emoji: data.emoji,
          category: data.category,
          featured: data.featured,
          active: true,
          fulfillmentInstructions: data.fulfillmentInstructions || null,
          sortOrder: 99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRewards((prev) => [...prev, newRew]);
        showToast("Reward Created", `${data.title} is now live.`);
      } else {
        showToast("Notice", res.error || "Could not create reward.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await toggleRewardActiveAction(id, active);
      setRewards((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active } : r))
      );
      showToast(active ? "Enabled" : "Disabled", "Reward updated.");
    } catch {
      showToast("Error", "Could not update reward.");
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await approveOrderAction(orderId);
      if (res.success) {
        const target = orders.find((o) => o.id === orderId);
        if (target) {
          setPoints((prev) => Math.max(0, prev - target.totalPoints));
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: "approved",
                    approvedAt: new Date().toISOString(),
                    fulfillmentItems:
                      res.fulfillmentItems && res.fulfillmentItems.length > 0
                        ? res.fulfillmentItems
                        : o.items.map((i) => ({
                            id: `fi_${Date.now()}_${i.id}`,
                            orderId: o.id,
                            label: `${i.titleSnapshot} (Ready & Prepared)`,
                            completed: false,
                            completedAt: null,
                          })),
                  }
                : o
            )
          );
        }
        showToast("Order Approved", "Points deducted & fulfillment unlocked.");
      } else {
        showToast("Notice", res.error || "Could not approve order.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const handleRejectOrder = async (orderId: string, reason?: string) => {
    try {
      const res = await rejectOrderAction(orderId, reason);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "rejected",
                  rejectionReason: reason || "Declined",
                }
              : o
          )
        );
        showToast("Declined", "Order declined without point deduction.");
      } else {
        showToast("Notice", res.error || "Could not decline order.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const handleToggleFulfillment = async (
    fulfillmentItemId: string,
    completed: boolean
  ) => {
    try {
      await toggleFulfillmentItemAction(fulfillmentItemId, completed);
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          fulfillmentItems: o.fulfillmentItems.map((fi) =>
            fi.id === fulfillmentItemId
              ? {
                  ...fi,
                  completed,
                  completedAt: completed ? new Date().toISOString() : null,
                }
              : fi
          ),
        }))
      );
    } catch {
      showToast("Error", "Could not toggle checklist item.");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const res = await completeOrderAction(orderId);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : o
          )
        );
        showToast("Delivered & Completed", "Order marked delivered!");
      } else {
        showToast("Notice", res.error || "Could not complete order.");
      }
    } catch {
      showToast("Error", "An error occurred.");
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <AdminDashboard
            points={points}
            rewardsCount={rewards.length}
            orders={orders}
            onOpenGivePoints={() => setIsGiveModalOpen(true)}
            onOpenCreateReward={() => setIsCreateRewardModalOpen(true)}
            onQuickAddPoints={(amt, reason) => handleGivePoints(amt, reason)}
            onApproveOrder={handleApproveOrder}
            onRejectOrder={(id) => handleRejectOrder(id)}
            onNavigateTab={(tab) => handleTabChange(tab as AdminTab)}
          />
        );
      case "points":
        return (
          <AdminPointsLedger
            points={points}
            history={history}
            onGivePoints={handleGivePoints}
            onDeductPoints={handleDeductPoints}
          />
        );
      case "rewards":
        return (
          <AdminRewardCatalog
            rewards={rewards}
            onCreateReward={handleCreateReward}
            onToggleActive={handleToggleActive}
            isCreateModalOpen={isCreateRewardModalOpen}
            onCloseCreateModal={() => setIsCreateRewardModalOpen(false)}
            onOpenCreateModal={() => setIsCreateRewardModalOpen(true)}
          />
        );
      case "orders":
        return (
          <AdminOrdersFulfillment
            orders={orders}
            onApproveOrder={handleApproveOrder}
            onRejectOrder={handleRejectOrder}
            onToggleFulfillment={handleToggleFulfillment}
            onCompleteOrder={handleCompleteOrder}
          />
        );
      case "history":
        return <AdminHistory orders={orders} pointTransactions={history} />;
      case "settings":
        return <AdminSettings />;
      default:
        return null;
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto transition-all ${isStandalone ? "p-2 sm:p-6" : ""}`}>
      <div className="desktop-canvas bg-white border border-warm-border min-h-[780px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* ADMIN SIDEBAR */}
        <aside className="w-full md:w-64 bg-stone-900 text-stone-200 p-5 flex flex-col justify-between shrink-0 select-none">
          <div>
            {/* Brand */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-romantic-500 flex items-center justify-center text-white font-bold shadow-md shadow-romantic-500/20">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-white">Reward Control</div>
                <div className="text-[10px] text-stone-400">Mahesh&apos;s Admin Panel</div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1.5 text-xs font-semibold">
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  currentTab === "dashboard"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleTabChange("points")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                  currentTab === "points"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Points Balance</span>
                </div>
                <span className="text-[10px] bg-stone-700 px-1.5 py-0.5 rounded text-stone-300 font-mono">
                  {points}
                </span>
              </button>

              <button
                onClick={() => handleTabChange("rewards")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                  currentTab === "rewards"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Gift className="w-4 h-4 text-romantic-400" />
                  <span>Reward Catalog</span>
                </div>
                <span className="text-[10px] bg-stone-700 px-1.5 py-0.5 rounded text-stone-300 font-mono">
                  {rewards.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange("orders")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                  currentTab === "orders"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-blue-400" />
                  <span>Orders & Fulfill</span>
                </div>
                {pendingCount > 0 && (
                  <span className="text-[10px] bg-romantic-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange("history")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  currentTab === "history"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>History Log</span>
              </button>

              <button
                onClick={() => handleTabChange("settings")}
                className={`admin-nav-btn w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  currentTab === "settings"
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                }`}
              >
                <Settings className="w-4 h-4 text-stone-400" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Bottom Mahesh Session & Logout */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-stone-200 text-xs">Mahesh</div>
                <div className="text-[10px] text-stone-400">Admin Control</div>
              </div>
            </div>
            <button
              onClick={async () => {
                await logoutAction();
                window.location.href = "/login";
              }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/40 hover:text-rose-300 text-stone-300 text-[11px] font-medium transition-colors"
            >
              Log Out
            </button>
          </div>
        </aside>

        {/* ADMIN CONTENT WORKSPACE */}
        <main className="flex-1 bg-warm-cream/50 overflow-y-auto p-6 md:p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
