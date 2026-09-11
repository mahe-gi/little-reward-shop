"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ToastContextType {
  showToast: (icon: string, text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    visible: boolean;
    icon: string;
    text: string;
  }>({
    visible: false,
    icon: "",
    text: "",
  });

  const showToast = useCallback((icon: string, text: string) => {
    setToast({ visible: true, icon, text });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2 transform transition-all duration-300 pointer-events-none",
          toast.visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-20 opacity-0 scale-95"
        )}
      >
        <span className="text-base">{toast.icon}</span>
        <span className="font-medium">{toast.text}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
