"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart-context";
import { ResponsiveAppShell } from "@/components/shell/ResponsiveAppShell";
import { BottomNav } from "@/components/shell/BottomNav";
import { FloatingCartBar } from "@/components/shell/FloatingCartBar";
import { Toast } from "@/components/ui/Toast";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { items, totalCount, totalCost } = useCart();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenReview = () => {
    if (items.length === 0) return;
    router.push("/rewards/checkout");
  };

  const isCheckoutRoute = pathname === "/rewards/checkout";
  const summary = items.map((i) => `${i.icon} ${i.title}`).join(", ");

  return (
    <ResponsiveAppShell
      footer={
        !isCheckoutRoute ? (
          <div className="flex flex-col">
            <FloatingCartBar
              itemsCount={totalCount}
              totalPoints={totalCost}
              summary={summary}
              onRequest={handleOpenReview}
              onOpenCart={handleOpenReview}
            />
            <BottomNav />
          </div>
        ) : undefined
      }
    >
      {children}

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </ResponsiveAppShell>
  );
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AppShellContent>{children}</AppShellContent>
    </CartProvider>
  );
}
