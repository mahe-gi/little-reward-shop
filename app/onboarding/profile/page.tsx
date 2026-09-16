"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveAppShell } from "@/components/shell/ResponsiveAppShell";
import { PillButton } from "@/components/ui/PillButton";
import { Avatar } from "@/components/ui/Avatar";
import { updateProfile, getProfile } from "@/actions/profile";
import { useSession, signOut } from "@/lib/auth-client";

const EMOJI_AVATARS = ["🧔", "🧑", "👧", "🦁", "🐱", "🐻", "🌸", "☕", "✨", "🦊"];

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProfile().then((res) => {
      if (mounted && res.success && res.user) {
        if (res.user.name) setName((prev) => prev || res.user!.name);
        if (res.user.email) setEmail((prev) => prev || res.user!.email);
        if (res.user.image) {
          setGooglePhoto(res.user.image);
          if (!selectedAvatar) setSelectedAvatar(res.user.avatar || res.user.image);
        } else if (res.user.avatar && !selectedAvatar) {
          setSelectedAvatar(res.user.avatar);
        }
      }
    });

    if (session?.user) {
      if (session.user.name && !name) setName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
      if (session.user.image) {
        setGooglePhoto(session.user.image);
        if (!selectedAvatar) setSelectedAvatar(session.user.image);
      }
    }

    return () => {
      mounted = false;
    };
  }, [session, name, email, selectedAvatar]);

  const handleNext = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const chosenAvatar = selectedAvatar || googlePhoto || "✨";
    await updateProfile(name, chosenAvatar);
    setLoading(false);
    router.push("/onboarding/couple");
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
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#807770] hover:text-[#24201D] transition-colors py-1 px-2 rounded-lg hover:bg-[#F5F2EB]"
        >
          <span className="text-sm">←</span>
          <span>Back to Sign In</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E06D75]" />
          <span className="text-[10px] uppercase font-bold text-[#807770] tracking-wider">
            Step 1 of 2 · Profile
          </span>
        </div>
      </div>

      <div className="my-auto space-y-4 text-center py-4">
        {/* Avatar Live Preview */}
        <div className="w-20 h-20 rounded-3xl bg-[#FDFBF7] border-2 border-[#E06D75]/30 shadow-sm flex items-center justify-center mx-auto overflow-hidden transition-transform hover:scale-105">
          <Avatar
            avatar={selectedAvatar || googlePhoto || "✨"}
            fallback="✨"
            size="xl"
            className="w-full h-full"
          />
        </div>

        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24201D] tracking-tight">
            Make it yours
          </h2>
          <p className="text-xs text-[#756963] mt-1">
            Choose how you&apos;ll appear to your partner.
          </p>
        </div>

        <div className="space-y-3.5 max-w-xs mx-auto text-left text-xs">
          {/* Verified Google Email Card */}
          {email && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] text-xs">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span className="truncate text-[#756963] font-medium text-[11px]">{email}</span>
              <span className="ml-auto text-[9px] font-bold text-[#7E9F85] uppercase tracking-wider bg-[#F4F7F5] border border-[#E5EEE9] px-1.5 py-0.5 rounded-md">
                Verified
              </span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block font-semibold text-[#24201D] mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name or nickname"
              className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6DE] rounded-xl text-xs text-[#24201D] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
            />
          </div>

          {/* Profile Picture / Avatar Choice */}
          <div>
            <label className="block font-semibold text-[#24201D] mb-1.5">
              Choose Profile Picture
            </label>

            {/* Google Photo Card Option */}
            {googlePhoto && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(googlePhoto)}
                className={`w-full p-2 mb-2 rounded-xl flex items-center justify-between border transition-all ${
                  selectedAvatar === googlePhoto
                    ? "bg-[#FCEBEE] border-[#E06D75] shadow-xs"
                    : "bg-white border-[#EAE6DE] hover:border-[#E06D75]/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar
                    avatar={googlePhoto}
                    fallback="👤"
                    size="sm"
                    className="w-7 h-7 rounded-lg"
                  />
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-[#24201D] block">
                      Use Google Profile Photo
                    </span>
                    <span className="text-[10px] text-[#807770]">From your Google account</span>
                  </div>
                </div>
                {selectedAvatar === googlePhoto ? (
                  <span className="w-5 h-5 rounded-full bg-[#E06D75] text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-[#EAE6DE]" />
                )}
              </button>
            )}

            {/* Emoji Grid Choices */}
            <div className="text-[10px] uppercase font-bold text-[#807770] tracking-wider mb-1">
              {googlePhoto ? "Or pick an aesthetic avatar:" : "Pick an avatar:"}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {EMOJI_AVATARS.map((emoji) => {
                const active = selectedAvatar === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                      active
                        ? "bg-[#FCEBEE] border-2 border-[#E06D75] shadow-sm scale-105"
                        : "bg-white border border-[#EAE6DE] hover:border-[#E06D75]"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <PillButton
            variant="primary"
            size="lg"
            className="w-full mt-2 font-semibold"
            loading={loading}
            onClick={handleNext}
          >
            {loading ? "Saving profile…" : "Continue"}
          </PillButton>
        </div>
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
          <span
            title="Step 2: Profile Setup (Current)"
            className="w-5 h-2 rounded-full bg-[#E06D75] transition-all"
          />
          <button
            type="button"
            onClick={handleNext}
            title="Step 3: Couple Sync"
            className="w-2.5 h-2.5 rounded-full bg-stone-300 hover:bg-[#E06D75]/60 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </ResponsiveAppShell>
  );
}
