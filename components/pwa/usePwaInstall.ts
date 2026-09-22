"use client";

import { useState, useEffect, useCallback } from "react";
import { subscribeToPushNotifications } from "@/lib/web-push-client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pairly_pwa_prompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;

    // Check standalone mode (PWA already installed and running)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(isStandaloneMode));

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 1. Check if an early prompt was already captured on window
    if (window.__pairly_pwa_prompt) {
      setDeferredPrompt(window.__pairly_pwa_prompt);
    }

    // 2. Listen for prompt-ready event from the early head script
    const handlePromptReady = () => {
      if (window.__pairly_pwa_prompt) {
        setDeferredPrompt(window.__pairly_pwa_prompt);
      }
    };

    // 3. In case beforeinstallprompt fires while this component is mounted
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pairly_pwa_prompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    // 4. When app is installed, clear prompt and mark standalone
    const handleAppInstalled = () => {
      window.__pairly_pwa_prompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("pairly:pwa-prompt-ready", handlePromptReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pairly:pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "ios" | "unavailable"> => {
    const prompt = deferredPrompt || (typeof window !== "undefined" ? window.__pairly_pwa_prompt : null);

    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
          if (typeof window !== "undefined") {
            window.__pairly_pwa_prompt = null;
          }
          setDeferredPrompt(null);
          // Request phone notification bar permission right upon installation
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            subscribeToPushNotifications().catch(() => {});
          }
        }
        return choice.outcome;
      } catch (err) {
        console.error("PWA install error:", err);
        return "unavailable";
      }
    }

    if (isIOS) {
      return "ios";
    }

    return "unavailable";
  }, [deferredPrompt, isIOS]);

  return {
    deferredPrompt: deferredPrompt || (typeof window !== "undefined" ? window.__pairly_pwa_prompt ?? null : null),
    isStandalone,
    isIOS,
    isMounted,
    hasPrompt: Boolean(deferredPrompt || (typeof window !== "undefined" && window.__pairly_pwa_prompt)),
    triggerInstall,
  };
}
