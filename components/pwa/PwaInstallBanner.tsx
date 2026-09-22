"use client";

import React, { useState, useEffect } from "react";
import { PillButton } from "@/components/ui/PillButton";
import { subscribeToPushNotifications } from "@/lib/web-push-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until client checks
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(Boolean(isStandaloneMode));

    // Check localStorage dismissal
    const dismissed = localStorage.getItem("pairly_pwa_dismissed");
    setIsDismissed(Boolean(dismissed));

    // Check iOS user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
        // Ask for phone notification bar permission right upon installation!
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
          subscribeToPushNotifications().catch(() => {});
        }
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosGuide(true);
    } else {
      // General guidance
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("pairly_pwa_dismissed", "true");
    }
  };

  // If already installed or dismissed, do not render
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      <div
        className={`rounded-3xl bg-gradient-to-br from-[#FAF7F2] via-white to-[#FCEBEE]/50 border border-[#FAD4DA] p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm ${className}`}
      >
        {/* Subtle decorative glowing corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#E06D75]/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* App Icon badge */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFFBF0] to-[#FCEBEE] border border-[#FAD4DA] shadow-xs flex items-center justify-center font-serif font-bold text-lg text-[#E06D75] shrink-0">
              P
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif text-base font-bold text-[#1E1A18] tracking-tight">
                  Download Pairly App
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFFBF0] border border-[#FEF3D6] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-xs text-[#756963] mt-0.5 leading-relaxed">
                Install on your home screen for instant partner notifications and 1-tap access.
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-stone-400 hover:text-[#1E1A18] p-1 text-sm font-semibold transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Action Row */}
        <div className="mt-3 pt-3 border-t border-[#FAD4DA]/60 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#756963] font-medium hidden sm:inline">
            Works offline &amp; feels like a native app
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#756963] hover:text-[#1E1A18] transition-colors"
            >
              Maybe later
            </button>
            <PillButton
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              className="font-bold shadow-xs active:scale-95"
            >
              Install App 📲
            </PillButton>
          </div>
        </div>
      </div>

      {/* iOS Safari / Browser Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 border border-[#EAE6DE] shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-3xl mx-auto shadow-2xs">
              📲
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-[#1E1A18]">
                Install on Your Device
              </h3>
              <p className="text-xs text-[#756963] leading-relaxed">
                Add Pairly to your home screen in 2 quick steps:
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] text-left text-xs space-y-2.5 text-[#1E1A18]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1E1A18] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the browser <strong className="font-semibold">Share</strong> button{" "}
                  <span className="font-mono text-sm">⎋</span> (at bottom on iPhone or top on Mac).
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1E1A18] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="font-semibold">&ldquo;Add to Home Screen&rdquo;</strong>{" "}
                  <span className="font-mono text-sm">⊞</span>.
                </span>
              </div>
            </div>

            <PillButton
              variant="primary"
              size="md"
              className="w-full font-bold shadow-xs active:scale-95"
              onClick={() => setShowIosGuide(false)}
            >
              Got it
            </PillButton>
          </div>
        </div>
      )}
    </>
  );
}
