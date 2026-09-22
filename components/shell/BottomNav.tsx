"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  TasksIcon,
  RewardsIcon,
  RequestsIcon,
  UsIcon,
} from "../ui/Icons";

export type NavTabId = "home" | "tasks" | "rewards" | "requests" | "us";

export interface NavTabItem {
  id: NavTabId;
  label: string;
  href: string;
  icon: (props: { size?: number; className?: string }) => React.ReactNode;
}

export interface BottomNavProps {
  activeTab?: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
  pendingRequestsCount?: number;
  className?: string;
}

const TABS: NavTabItem[] = [
  { id: "home", label: "Home", href: "/home", icon: HomeIcon },
  { id: "tasks", label: "Habits", href: "/tasks", icon: TasksIcon },
  { id: "rewards", label: "Boutique", href: "/rewards", icon: RewardsIcon },
  { id: "requests", label: "Wishes", href: "/requests", icon: RequestsIcon },
  { id: "us", label: "Us", href: "/us", icon: UsIcon },
];

export function BottomNav({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0,
  className = "",
}: BottomNavProps) {
  const pathname = usePathname();
  const [optimisticTab, setOptimisticTab] = React.useState<NavTabId | null>(null);

  React.useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const getIsActive = (tab: NavTabItem) => {
    if (optimisticTab) return optimisticTab === tab.id;
    if (activeTab) return activeTab === tab.id;
    if (!pathname) return tab.id === "home";
    if (tab.href === "/home") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(tab.href);
  };

  return (
    <div className={`w-full px-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 pointer-events-none ${className}`}>
      {/* Floating Glass Dock */}
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto max-w-md mx-auto rounded-[28px] glass-dock px-2 py-1.5 shadow-[0_12px_36px_-6px_rgba(40,25,20,0.14)]"
      >
        <div className="flex items-center justify-between">
          {TABS.map((tab) => {
            const isActive = getIsActive(tab);
            const IconComponent = tab.icon;
            const isRequestsTab = tab.id === "requests";
            const hasPending = isRequestsTab && pendingRequestsCount > 0;

            const content = (
              <div
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 group cursor-pointer select-none active:scale-90 ${
                  isActive
                    ? "text-[#E06D75]"
                    : "text-[#756963] hover:text-[#1E1A18]"
                }`}
              >
                {/* Active Soft Glow Capsule */}
                {isActive && (
                  <div
                    className="absolute inset-0 bg-[#E06D75]/12 rounded-2xl -z-10 scale-95 shadow-inner"
                    aria-hidden="true"
                  />
                )}

                {/* Icon Container with subtle spring state */}
                <div className="relative flex items-center justify-center">
                  <IconComponent
                    size={21}
                    className={`transition-all duration-300 ${
                      isActive
                        ? "scale-110 stroke-[2.4] drop-shadow-[0_2px_8px_rgba(224,109,117,0.35)]"
                        : "group-hover:scale-105 stroke-[1.8]"
                    }`}
                  />

                  {/* Badge */}
                  {hasPending && (
                    <span
                      className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-[#E06D75] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white shadow-xs"
                      aria-label={`${pendingRequestsCount} pending requests`}
                    >
                      {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 tracking-tight leading-none transition-all duration-200 ${
                    isActive
                      ? "font-bold text-[#E06D75] scale-100"
                      : "font-medium text-[#756963] opacity-80 group-hover:opacity-100"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Micro Active Dot */}
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#E06D75] mt-0.5 animate-pulse" />
                )}
              </div>
            );

            if (onTabChange) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className="focus:outline-none flex-1 flex justify-center"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setOptimisticTab(tab.id)}
                className="focus:outline-none flex-1 flex justify-center"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
