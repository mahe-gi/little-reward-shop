"use client";

import { useEffect, useRef } from "react";
import { updateBatteryStatus } from "@/actions/battery";

/**
 * Headless background listener that syncs the device's battery level
 * and charging state automatically on supported platforms (Android Chrome, Edge, PWAs).
 * Gracefully silent on unsupported browsers (e.g. iOS Safari).
 */
export function BatterySyncListener() {
  const lastSyncRef = useRef<{ level: number; isCharging: boolean; time: number }>({
    level: -1,
    isCharging: false,
    time: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for Battery Status API
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }>;
    };

    if (!nav.getBattery || typeof nav.getBattery !== "function") return;

    let batteryManager: {
      level: number;
      charging: boolean;
      addEventListener: (type: string, listener: () => void) => void;
      removeEventListener: (type: string, listener: () => void) => void;
    } | null = null;

    const handleBatteryUpdate = () => {
      if (!batteryManager) return;

      const currentLevel = Math.max(0, Math.min(100, Math.round(batteryManager.level * 100)));
      const currentCharging = Boolean(batteryManager.charging);
      const now = Date.now();

      const last = lastSyncRef.current;
      const chargingChanged = last.isCharging !== currentCharging;
      const levelChanged = Math.abs(last.level - currentLevel) >= 1;
      const enoughTimeElapsed = now - last.time > 45000; // at least 45 seconds

      // Sync on first mount, when charging toggles, or when percentage changes after 45s
      if (last.level === -1 || chargingChanged || (levelChanged && enoughTimeElapsed)) {
        lastSyncRef.current = {
          level: currentLevel,
          isCharging: currentCharging,
          time: now,
        };

        updateBatteryStatus(currentLevel, currentCharging).catch(() => {});
      }
    };

    nav
      .getBattery()
      .then((battery) => {
        batteryManager = battery;
        handleBatteryUpdate();

        battery.addEventListener("levelchange", handleBatteryUpdate);
        battery.addEventListener("chargingchange", handleBatteryUpdate);
      })
      .catch(() => {
        // Suppress browser denial errors
      });

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener("levelchange", handleBatteryUpdate);
        batteryManager.removeEventListener("chargingchange", handleBatteryUpdate);
      }
    };
  }, []);

  return null;
}
