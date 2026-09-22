"use client";

import React, { useState, useEffect } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { subscribeToPushNotifications } from "@/lib/web-push-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstalled?: () => void;
}

export function PwaInstallModal({ isOpen, onClose, onInstalled }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          // Immediately prompt for phone notification bar permission
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            await subscribeToPushNotifications().catch(() => {});
          }
          onInstalled?.();
          onClose();
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-4 py-2 max-w-sm mx-auto">
        {/* App Icon preview */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFFBF0] via-white to-[#FCEBEE] border border-[#FAD4DA] shadow-sm flex items-center justify-center text-3xl mx-auto">
          {/* Custom brand icon */}
          <span className="font-serif font-bold text-2xl text-[#E06D75]">P</span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Progressive Web App
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1A18] tracking-tight mt-0.5">
            Install Pairly on Your Phone
          </h3>
          <p className="text-xs text-[#756963] mt-1 leading-relaxed">
            Get instant lock screen notifications, full-screen experience, and lightning fast access directly from your home screen.
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-[#FAF7F2] border border-[#EAE6DE] rounded-2xl p-3.5 text-left space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-[#24201D]">
            <span className="w-5 h-5 rounded-full bg-white border border-[#EAE6DE] flex items-center justify-center text-[10px] text-[#557567] font-bold">
              ✓
            </span>
            <span>Real-time phone notification bar alerts</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#24201D]">
            <span className="w-5 h-5 rounded-full bg-white border border-[#EAE6DE] flex items-center justify-center text-[10px] text-[#557567] font-bold">
              ✓
            </span>
            <span>Clean fullscreen app with zero browser URL bars</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#24201D]">
            <span className="w-5 h-5 rounded-full bg-white border border-[#EAE6DE] flex items-center justify-center text-[10px] text-[#557567] font-bold">
              ✓
            </span>
            <span>Always 1-tap away on your mobile home screen</span>
          </div>
        </div>

        {/* Action Button or Instructions */}
        {deferredPrompt ? (
          <div className="pt-2 space-y-2">
            <PillButton
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-xs active:scale-95"
              onClick={handleInstall}
              loading={installing}
            >
              Install App Now
            </PillButton>
            <PillButton
              variant="ghost"
              size="sm"
              className="w-full text-xs text-[#756963]"
              onClick={onClose}
            >
              Cancel
            </PillButton>
          </div>
        ) : isIOS ? (
          <div className="pt-1 space-y-3">
            <div className="p-3 bg-white border border-[#EAE6DE] rounded-xl text-left space-y-2 text-xs text-[#24201D]">
              <div className="font-semibold text-[#1E1A18] text-[11px] uppercase tracking-wider">
                Safari Installation Steps:
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E06D75]">1.</span>
                <span>
                  Tap the <strong className="font-semibold">Share</strong> button{" "}
                  <span className="font-mono text-sm">⎋</span> at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E06D75]">2.</span>
                <span>
                  Scroll down and tap <strong className="font-semibold">&ldquo;Add to Home Screen&rdquo;</strong>{" "}
                  <span className="font-mono text-sm">⊞</span>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E06D75]">3.</span>
                <span>
                  Tap <strong className="font-semibold">Add</strong> in the top right corner.
                </span>
              </div>
            </div>
            <PillButton
              variant="primary"
              size="md"
              className="w-full font-bold shadow-xs"
              onClick={onClose}
            >
              Got it
            </PillButton>
          </div>
        ) : (
          <div className="pt-1 space-y-3">
            <div className="p-3 bg-white border border-[#EAE6DE] rounded-xl text-left space-y-2 text-xs text-[#24201D]">
              <div className="font-semibold text-[#1E1A18] text-[11px] uppercase tracking-wider">
                Browser Installation Steps:
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E06D75]">1.</span>
                <span>
                  Tap the browser menu <strong className="font-semibold">(⋮ or three dots)</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#E06D75]">2.</span>
                <span>
                  Tap <strong className="font-semibold">&ldquo;Install App&rdquo;</strong> or <strong className="font-semibold">&ldquo;Add to Home screen&rdquo;</strong>.
                </span>
              </div>
            </div>
            <PillButton
              variant="primary"
              size="md"
              className="w-full font-bold shadow-xs"
              onClick={onClose}
            >
              Got it
            </PillButton>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
