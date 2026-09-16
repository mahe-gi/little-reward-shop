"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  rewardId: string;
  title: string;
  cost: number;
  icon: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (reward: { id: string; title: string; cost: number; icon: string }) => void;
  decrementItem: (rewardId: string) => void;
  updateQuantity: (rewardId: string, quantity: number) => void;
  removeItem: (rewardId: string) => void;
  clearCart: () => void;
  totalCost: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("pairly_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save cart to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem("pairly_cart", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (reward: { id: string; title: string; cost: number; icon: string }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.rewardId === reward.id);
      if (existing) {
        return prev.map((i) =>
          i.rewardId === reward.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          rewardId: reward.id,
          title: reward.title,
          cost: reward.cost,
          icon: reward.icon,
          quantity: 1,
        },
      ];
    });
  };

  const decrementItem = (rewardId: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.rewardId === rewardId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const updateQuantity = (rewardId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(rewardId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.rewardId === rewardId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (rewardId: string) => {
    setItems((prev) => prev.filter((i) => i.rewardId !== rewardId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCost = items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        decrementItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalCost,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
