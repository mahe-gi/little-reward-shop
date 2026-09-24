"use client";

import React from "react";

export interface PartnerBatteryBadgeProps {
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  batteryUpdatedAt?: string | null;
  partnerName?: string;
  className?: string;
}

/**
 * Very small, subtle, and minimal battery indicator.
 * Displays a tiny micro-battery icon filled according to percentage + a small percentage number.
 * No manual editing, modals, or clutter.
 */
export function PartnerBatteryBadge({
  batteryLevel,
  isCharging = false,
  partnerName = "Partner",
  className = "",
}: PartnerBatteryBadgeProps) {
  if (typeof batteryLevel !== "number" || batteryLevel < 0) {
    return null;
  }

  const level = Math.max(0, Math.min(100, Math.round(batteryLevel)));
  const isLow = level <= 20;

  // Max inner fill width is 9.5px inside the 13px battery body
  const fillWidth = Math.max(1.5, (9.5 * level) / 100);
  const fillColor = isCharging
    ? "#F59E0B" // Amber
    : isLow
    ? "#EF4444" // Red
    : "#10B981"; // Emerald

  return (
    <span
      title={`${partnerName}'s battery: ${level}% ${isCharging ? "(Charging ⚡)" : ""}`}
      className={`inline-flex items-center gap-1 select-none leading-none ${className}`}
    >
      {/* Micro SVG Battery Shell */}
      <span className="relative inline-flex items-center shrink-0">
        <svg
          className="w-4 h-2.5"
          viewBox="0 0 17 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shell */}
          <rect
            x="0.75"
            y="0.75"
            width="13"
            height="7.5"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1"
            className="opacity-75"
          />
          {/* Battery Positive Terminal Tip */}
          <path
            d="M15 3C15.4 3 15.75 3.35 15.75 3.75V5.25C15.75 5.65 15.4 6 15 6V3Z"
            fill="currentColor"
            className="opacity-75"
          />
          {/* Inner Proportionate Fill Bar */}
          <rect
            x="2"
            y="2"
            width={fillWidth}
            height="5"
            rx="0.75"
            fill={fillColor}
          />
        </svg>

        {isCharging && (
          <span className="absolute -top-1 -right-1 text-[8px] text-amber-400 font-bold leading-none">
            ⚡
          </span>
        )}
      </span>

      {/* Very Small Percentage Number */}
      <span className="text-[10px] font-mono font-medium tracking-tight opacity-90">
        {level}%
      </span>
    </span>
  );
}
