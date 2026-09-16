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
  { id: "tasks", label: "Tasks", href: "/tasks", icon: TasksIcon },
  { id: "rewards", label: "Rewards", href: "/rewards", icon: RewardsIcon },
  { id: "requests", label: "Requests", href: "/requests", icon: RequestsIcon },
  { id: "us", label: "Us", href: "/us", icon: UsIcon },
];

export function BottomNav({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0,
  className = "",
}: BottomNavProps) {
  const pathname = usePathname();

  const getIsActive = (tab: NavTabItem) => {
    if (activeTab) {
      return activeTab === tab.id;
    }
    if (!pathname) return tab.id === "home";
    if (tab.href === "/home") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(tab.href);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`w-full bg-[#FDFBF7]/95 backdrop-blur-lg border-t border-[#EAE6DE] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-2px_rgba(60,45,40,0.04)] ${className}`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const isActive = getIsActive(tab);
          const IconComponent = tab.icon;
          const isRequestsTab = tab.id === "requests";
          const hasPending = isRequestsTab && pendingRequestsCount > 0;

          const content = (
            <div
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? "text-[#E06D75]"
                  : "text-[#756963] hover:text-[#24201D]"
              }`}
            >
              {/* Active pill background aura */}
              {isActive && (
                <div
                  className="absolute inset-0 bg-[#E06D75]/10 rounded-2xl -z-10 scale-95 animate-in fade-in zoom-in-95 duration-200"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container with optional notification badge */}
              <div className="relative flex items-center justify-center">
                <IconComponent
                  size={22}
                  className={`transition-transform duration-200 ${
                    isActive
                      ? "scale-110 stroke-[2.3]"
                      : "group-hover:scale-105 stroke-[1.8]"
                  }`}
                />

                {/* Pending Requests Notification Dot / Badge */}
                {hasPending && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#E06D75] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FDFBF7] shadow-sm animate-pulse"
                    aria-label={`${pendingRequestsCount} pending requests`}
                  >
                    {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                  </span>
                )}
              </div>

              {/* Tab label */}
              <span
                className={`text-[11px] mt-1 font-medium tracking-tight leading-none ${
                  isActive ? "font-semibold text-[#E06D75]" : "text-[#756963]"
                }`}
              >
                {tab.label}
              </span>
            </div>
          );

          if (onTabChange) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="focus:outline-none"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="focus:outline-none"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
