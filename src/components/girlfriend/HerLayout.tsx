"use client";

import React, { useState, useEffect } from "react";
import { Reward, RedemptionOrder, CartItem, PointTransaction } from "@/types";
import { HerHome } from "./HerHome";
import { RewardShop } from "./RewardShop";
import { HerCart } from "./HerCart";
import { HerOrders } from "./HerOrders";
import { OrderDetailView } from "./OrderDetailView";
import { RewardDetailSheet } from "./RewardDetailSheet";
import { RedemptionConfirmModal } from "./RedemptionConfirmModal";
import { OrderSuccessView } from "./OrderSuccessView";
import { HerProfileModal } from "./HerProfileModal";
import { createOrderAction } from "@/actions/orders";
import {
  addToCartAction,
  updateCartQuantityAction,
  removeFromCartAction,
} from "@/actions/cart";
import { useToast } from "@/components/shared/Toast";

interface HerLayoutProps {
  initialPoints: number;
  initialRewards: Reward[];
  initialOrders: RedemptionOrder[];
  initialCart?: CartItem[];
  initialTab?: "home" | "shop" | "cart" | "orders";
  todayPointsEarned?: number;
  recentTransactions?: PointTransaction[];
  userName?: string;
}

export function HerLayout({
  initialPoints,
  initialRewards,
  initialOrders,
  initialCart = [],
  initialTab = "home",
  todayPointsEarned = 0,
  recentTransactions = [],
  userName = "Her",
}: HerLayoutProps) {
  const { showToast } = useToast();

  const [points, setPoints] = useState(initialPoints);
  const [rewards] = useState<Reward[]>(initialRewards);
  const [orders, setOrders] = useState<RedemptionOrder[]>(initialOrders);

  const [currentTab, setCurrentTab] = useState<"home" | "shop" | "cart" | "orders">(initialTab);
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RedemptionOrder | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingNote, setPendingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: string;
    totalPoints: number;
    itemsCount: number;
  } | null>(null);

  const handleTabChange = (tab: "home" | "shop" | "cart" | "orders") => {
    setSelectedOrder(null);
    setSuccessOrder(null);
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "home") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.replaceState({}, "", url.toString());
      try {
        localStorage.setItem("reward_shop_active_tab", tab);
      } catch {}
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && initialTab === "home") {
      try {
        const saved = localStorage.getItem("reward_shop_active_tab");
        if (saved && (saved === "shop" || saved === "cart" || saved === "orders")) {
          setCurrentTab(saved as any);
          const url = new URL(window.location.href);
          url.searchParams.set("tab", saved);
          window.history.replaceState({}, "", url.toString());
        }
      } catch {}
    }
  }, [initialTab]);

  // Total items count for cart badge
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPoints = cart.reduce((acc, item) => acc + item.points * item.quantity, 0);

  // Active in-progress or pending order
  const activeOrder =
    orders.find(
      (o) => o.status === "pending" || o.status === "approved" || o.status === "fulfilling"
    ) || null;

  const handleAddToCart = async (reward: Reward) => {
    // Optimistic UI update
    setCart((prev) => {
      const existing = prev.find((item) => item.rewardId === reward.id);
      if (existing) {
        return prev.map((item) =>
          item.rewardId === reward.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          rewardId: reward.id,
          title: reward.title,
          description: reward.description,
          points: reward.points,
          emoji: reward.emoji,
          quantity: 1,
        },
      ];
    });
    showToast("Added to Cart! " + reward.emoji, `${reward.title} added ❤️`);

    // Sync to Database
    const res = await addToCartAction(reward.id);
    if (!res.success) {
      showToast("⚠️ Notice", res.error || "Could not save to cart.");
    } else if (res.cart) {
      setCart(res.cart);
    }
  };

  const handleUpdateQuantity = async (rewardId: string, delta: number) => {
    // Optimistic UI update
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.rewardId === rewardId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );

    // Sync to Database
    const res = await updateCartQuantityAction(rewardId, delta);
    if (!res.success) {
      showToast("⚠️ Notice", res.error || "Could not update cart quantity.");
    } else if (res.cart) {
      setCart(res.cart);
    }
  };

  const handleRemoveItem = async (rewardId: string) => {
    // Optimistic UI update
    setCart((prev) => prev.filter((item) => item.rewardId !== rewardId));

    // Sync to Database
    const res = await removeFromCartAction(rewardId);
    if (!res.success) {
      showToast("⚠️ Notice", res.error || "Could not remove item from cart.");
    } else if (res.cart) {
      setCart(res.cart);
    }
  };

  const handleStartRedemption = (note: string) => {
    setPendingNote(note);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteRedemption = async () => {
    setIsSubmitting(true);
    try {
      const res = await createOrderAction(cart, pendingNote);
      if (!res.success) {
        showToast("⚠️ Notice", res.error || "Could not submit order.");
        setIsSubmitting(false);
        setIsConfirmModalOpen(false);
        return;
      }

      // Create local optimistic order representation
      const newOrder: RedemptionOrder = {
        id: res.orderId!,
        orderNumber: res.orderNumber!,
        userId: "user_girlfriend",
        status: "pending",
        totalPoints: totalCartPoints,
        note: pendingNote || null,
        rejectionReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: cart.map((c) => ({
          id: `ri_${Date.now()}_${c.rewardId}`,
          orderId: res.orderId!,
          rewardId: c.rewardId,
          titleSnapshot: c.title,
          descriptionSnapshot: c.description,
          pointsSnapshot: c.points,
          quantity: c.quantity,
          createdAt: new Date().toISOString(),
        })),
        fulfillmentItems: [],
      };

      setOrders((prev) => [newOrder, ...prev]);
      setSuccessOrder({
        orderNumber: res.orderNumber!,
        totalPoints: totalCartPoints,
        itemsCount: cart.length,
      });

      // Clear cart
      setCart([]);
      setIsConfirmModalOpen(false);
      showToast("💖 Request Sent!", "Notification sent ❤️");
    } catch {
      showToast("⚠️ Error", "Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (successOrder) {
      return (
        <OrderSuccessView
          orderNumber={successOrder.orderNumber}
          totalPoints={successOrder.totalPoints}
          itemsCount={successOrder.itemsCount}
          onBackToShop={() => handleTabChange("shop")}
          onViewTimeline={() => handleTabChange("orders")}
        />
      );
    }

    if (selectedOrder) {
      return (
        <OrderDetailView
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      );
    }

    switch (currentTab) {
      case "home":
        return (
          <HerHome
            points={points}
            featuredRewards={rewards}
            activeOrder={activeOrder}
            todayPointsEarned={todayPointsEarned}
            recentTransactions={recentTransactions}
            onNavigate={(tab) => handleTabChange(tab)}
            onSelectReward={(r) => setSelectedReward(r)}
            onAddToCart={handleAddToCart}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onViewOrder={(ord) => setSelectedOrder(ord)}
          />
        );
      case "shop":
        return (
          <RewardShop
            rewards={rewards}
            points={points}
            onSelectReward={(r) => setSelectedReward(r)}
            onAddToCart={handleAddToCart}
          />
        );
      case "cart":
        return (
          <HerCart
            cart={cart}
            availablePoints={points}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onExploreRewards={() => handleTabChange("shop")}
            onSubmitRedemption={handleStartRedemption}
          />
        );
      case "orders":
        return (
          <HerOrders
            orders={orders}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onExploreRewards={() => handleTabChange("shop")}
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-warm-canvas flex justify-center selection:bg-romantic-100">
      <div className="w-full max-w-md min-h-screen bg-warm-cream shadow-2xl border-x border-warm-border/70 flex flex-col relative pb-20">
        <main className="flex-1 flex flex-col overflow-y-auto">
          {renderContent()}
        </main>

        <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto h-16 bg-white/95 backdrop-blur-md border-t border-warm-border px-6 flex items-center justify-around z-40 safe-bottom shadow-lg select-none">
          <button
            onClick={() => handleTabChange("home")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentTab === "home" && !selectedOrder && !successOrder
                ? "text-romantic-600"
                : "text-warm-subtle hover:text-romantic-600"
            }`}
          >
            <span className="text-lg leading-none">🏠</span>
            <span className="text-[10px] font-semibold mt-1">Home</span>
          </button>

          <button
            onClick={() => handleTabChange("shop")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentTab === "shop" && !selectedOrder && !successOrder
                ? "text-romantic-600"
                : "text-warm-subtle hover:text-romantic-600"
            }`}
          >
            <span className="text-lg leading-none">🎁</span>
            <span className="text-[10px] font-medium mt-1">Rewards</span>
          </button>

          <button
            onClick={() => handleTabChange("cart")}
            className={`relative flex flex-col items-center justify-center transition-colors ${
              currentTab === "cart" && !selectedOrder && !successOrder
                ? "text-romantic-600"
                : "text-warm-subtle hover:text-romantic-600"
            }`}
          >
            <span className="text-lg leading-none">🛒</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-romantic-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
            <span className="text-[10px] font-medium mt-1">Cart</span>
          </button>

          <button
            onClick={() => handleTabChange("orders")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentTab === "orders" || selectedOrder
                ? "text-romantic-600"
                : "text-warm-subtle hover:text-romantic-600"
            }`}
          >
            <span className="text-lg leading-none">📦</span>
            <span className="text-[10px] font-medium mt-1">Orders</span>
          </button>
        </nav>

        <RewardDetailSheet
          reward={selectedReward}
          isOpen={Boolean(selectedReward)}
          onClose={() => setSelectedReward(null)}
          availablePoints={points}
          onAddToCart={handleAddToCart}
        />

        <RedemptionConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleExecuteRedemption}
          items={cart}
          totalPoints={totalCartPoints}
          remainingPoints={points - totalCartPoints}
          isSubmitting={isSubmitting}
        />

        <HerProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          points={points}
          userName={userName}
        />
      </div>
    </div>
  );
}
