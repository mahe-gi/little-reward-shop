"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveAppShell } from "@/components/shell/ResponsiveAppShell";
import { PillButton } from "@/components/ui/PillButton";
import { Toast } from "@/components/ui/Toast";
import {
  getOrCreateCoupleInviteCode,
  joinCoupleSpace,
  checkPartnerConnected,
} from "@/actions/couple";
import { signOut } from "@/lib/auth-client";

export default function OnboardingCouplePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const res = await getOrCreateCoupleInviteCode();
      if (mounted) {
        if (res.success && res.inviteCode) {
          setCreatedCode(res.inviteCode);
          if (res.partnerJoined) {
            setPartnerConnected(true);
            setPartnerName(res.partnerName);
            setTimeout(() => {
              router.push("/home");
            }, 600);
          }
        }
        setInitializing(false);
      }
    };
    init();

    // Auto-check for partner connection every 2.5 seconds
    const interval = setInterval(async () => {
      if (!mounted) return;
      const status = await checkPartnerConnected();
      if (status.connected && mounted) {
        setPartnerConnected(true);
        setPartnerName(status.partnerName);
        setToastMessage(
          `🎉 ${status.partnerName || "Your partner"} just connected! Entering your space... ❤️`
        );
        clearInterval(interval);
        setTimeout(() => {
          router.push("/home");
        }, 1200);
      }
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError("Please enter your partner's invite code!");
      return;
    }

    setLoading(true);
    setError(null);
    const res = await joinCoupleSpace(joinCode);
    setLoading(false);

    if (res.success) {
      setToastMessage("🎉 Connected together as a couple! ❤️");
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } else {
      setError(res.error || "Failed to join couple space");
    }
  };

  const handleCopy = () => {
    if (createdCode && navigator.clipboard) {
      navigator.clipboard.writeText(createdCode);
      setToastMessage(`Pairing code ${createdCode} copied! 💌`);
    }
  };

  const handleShare = () => {
    if (createdCode) {
      if (navigator.share) {
        navigator
          .share({
            title: "Join me on Pairly ❤️",
            text: `Connect with me on Pairly using our pairing code: ${createdCode}`,
            url: window.location.origin,
          })
          .catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(
          `Join me on Pairly! Our pairing code is ${createdCode}: ${window.location.origin}`
        );
        setToastMessage("Invite message copied to clipboard! 💌");
      }
    }
  };

  const handleSignOut = async () => {
    document.cookie = "pairly_dev_user=; path=/; max-age=0";
    await signOut();
    router.push("/login");
  };

  return (
    <ResponsiveAppShell className="justify-between p-6">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push("/onboarding/profile")}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#807770] hover:text-[#24201D] transition-colors py-1 px-2 rounded-lg hover:bg-[#F5F2EB]"
        >
          <span className="text-sm">←</span>
          <span>Back to Profile</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E06D75]" />
            <span className="text-[10px] uppercase font-bold text-[#807770] tracking-wider">
              Step 2 of 2 · Sync
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-[#807770] hover:text-[#E06D75] transition-colors py-1 px-1.5 rounded-lg hover:bg-[#FCEBEE]"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="my-auto space-y-4 text-center py-4 max-w-xs mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#FCEBEE] text-[#E06D75] flex items-center justify-center text-3xl mx-auto shadow-sm">
          🔗
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24201D] tracking-tight">
            Create your space for two
          </h2>
          <p className="text-xs text-[#756963] mt-1">
            Share your invite code with your partner.
          </p>
        </div>

        {/* 2-Segment Control */}
        <div className="p-1 bg-[#F5F2EB] rounded-2xl flex text-xs font-semibold border border-[#EAE6DE]">
          <button
            type="button"
            onClick={() => {
              setTab("create");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              tab === "create"
                ? "bg-white text-[#E06D75] shadow-sm"
                : "text-[#756963] hover:text-[#24201D]"
            }`}
          >
            Your Invite Code
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("join");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              tab === "join"
                ? "bg-white text-[#E06D75] shadow-sm"
                : "text-[#756963] hover:text-[#24201D]"
            }`}
          >
            Have an invite code?
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Panel 1: Share Code */}
        {tab === "create" && (
          <div className="space-y-3 text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#E06D75]/30 shadow-sm text-center space-y-2">
              <span className="text-[10px] font-bold text-[#E06D75] uppercase tracking-wider">
                Your Invite Code
              </span>
              <div className="font-mono text-2xl font-bold text-[#24201D] tracking-widest select-all my-1">
                {initializing ? "Generating..." : createdCode || "..."}
              </div>
              <p className="text-[11px] text-[#756963]">
                Share this code with your partner to connect your space.
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2 px-3 bg-[#F5F2EB] hover:bg-[#FCEBEE] hover:text-[#E06D75] text-[#24201D] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Code</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 bg-[#F5F2EB] hover:bg-[#FCEBEE] hover:text-[#E06D75] text-[#24201D] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share Code</span>
                </button>
              </div>
            </div>

            {partnerConnected ? (
              <div className="p-3 rounded-xl bg-[#F4F7F5] border border-[#7E9F85] flex items-center justify-center gap-2 text-xs text-[#557567] font-semibold">
                <span>{partnerName ? `Connected with ${partnerName} ❤️` : "You're connected ❤️"}</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center gap-1.5 text-center">
                <span className="w-2 h-2 rounded-full bg-[#E06D75] animate-pulse" />
                <span className="text-xs text-[#E06D75] font-semibold">Waiting for your partner ❤️</span>
              </div>
            )}

            <PillButton
              variant={partnerConnected ? "primary" : "secondary"}
              size="lg"
              className={`w-full transition-all ${!partnerConnected ? "opacity-75" : ""}`}
              onClick={() => {
                if (partnerConnected) {
                  router.push("/home");
                } else {
                  setToastMessage("Share your invite code with your partner to connect.");
                }
              }}
            >
              {partnerConnected ? "Enter Our Space ❤️" : "Waiting for Partner to Connect..."}
            </PillButton>
          </div>
        )}

        {/* Panel 2: Join with Code */}
        {tab === "join" && (
          <form onSubmit={handleJoin} className="space-y-3 text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#EAE6DE] shadow-sm space-y-2">
              <label className="block font-semibold text-[#24201D] text-xs">
                Have an invite code?
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                maxLength={10}
                className="w-full px-3 py-2.5 border border-[#EAE6DE] rounded-xl text-xs font-mono font-bold tracking-widest text-center uppercase bg-[#FAF7F2] focus:ring-1 focus:ring-[#E06D75] focus:outline-none"
              />
              <p className="text-[11px] text-[#756963] text-center">
                Enter the code your partner shared with you.
              </p>
            </div>

            <PillButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Connect
            </PillButton>
          </form>
        )}
      </div>

      {/* 3 Step Indicator Dots (Interactive) */}
      <div className="pb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleSignOut}
            title="Step 1: Sign In"
            className="w-2.5 h-2.5 rounded-full bg-stone-300 hover:bg-stone-400 transition-colors cursor-pointer"
          />
          <button
            type="button"
            onClick={() => router.push("/onboarding/profile")}
            title="Step 2: Profile Setup"
            className="w-2.5 h-2.5 rounded-full bg-stone-300 hover:bg-[#E06D75]/60 transition-colors cursor-pointer"
          />
          <span
            title="Step 3: Couple Sync (Current)"
            className="w-5 h-2 rounded-full bg-[#E06D75] transition-all"
          />
        </div>
      </div>

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </ResponsiveAppShell>
  );
}
