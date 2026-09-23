"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { signOut } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { StreakModal } from "@/components/modals/StreakModal";
import { PointsAdjustModal } from "@/components/modals/PointsAdjustModal";
import { Toast } from "@/components/ui/Toast";
import { FlameIcon } from "@/components/ui/Icons";
import { PwaInstallModal } from "@/components/pwa/PwaInstallModal";
import { DeviceNotificationToggle } from "@/components/notifications/DeviceNotificationToggle";
import { WhispersSheet } from "@/components/nudges/WhispersSheet";

function formatPresence(isoString: string | null | undefined): { isOnline: boolean; text: string } {
  if (!isoString) return { isOnline: false, text: "Offline" };
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return { isOnline: false, text: "Offline" };

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Active within 2.5 minutes
  if (diffSec < 150) {
    return { isOnline: true, text: "Active now" };
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return { isOnline: false, text: `${diffMin}m ago` };
  }

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return { isOnline: false, text: `${diffHr}h ago` };
  }

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return { isOnline: false, text: "Yesterday" };
  if (diffDay < 7) return { isOnline: false, text: `${diffDay}d ago` };

  return {
    isOnline: false,
    text: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

export interface UsData {
  user: { id: string; name: string; email: string; avatar: string | null; pointBalance: number; lastActiveAt: string | null };
  couple: { id: string; name: string; inviteCode: string; streakCount: number };
  partner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    pointBalance: number;
    lastActiveAt: string | null;
    hasPushEnabled?: boolean;
    latestNotification?: {
      title: string;
      createdAt: string;
      readAt: string | null;
    } | null;
  } | null;
}

interface UsClientProps {
  initialData: UsData;
}

export function UsClient({ initialData }: UsClientProps) {
  const router = useRouter();
  const [data, setData] = useState<UsData>(initialData);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [whispersOpen, setWhispersOpen] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(standalone));
    }
  }, []);

  // Periodic polling every 20 seconds to keep WhatsApp-style online status live
  React.useEffect(() => {
    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const res = await getCoupleState();
        if (res.success && res.data) {
          setData(res.data as UsData);
        }
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Give / Adjust Points modal state
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusTarget, setBonusTarget] = useState<"self" | "partner">("self");
  const [bonusMode, setBonusMode] = useState<"add" | "remove">("add");

  const handleCopyCode = () => {
    if (data.couple.inviteCode && navigator.clipboard) {
      navigator.clipboard.writeText(data.couple.inviteCode);
      setCopied(true);
      setToastMessage(`Space code ${data.couple.inviteCode} copied!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const partnerName = data.partner?.name || "Partner";
  const userPresence = formatPresence(data.user.lastActiveAt);
  const partnerPresence = formatPresence(data.partner?.lastActiveAt);

  return (
    <div className="flex-1 p-4 sm:p-5 pb-28 space-y-4">
      {/* Top Header */}
      <div className="px-1 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#AB3B46]">
            Couple Sanctuary
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1E1A18] mt-0.5">
            Us
          </h1>
        </div>
        <p className="text-xs text-[#756963] font-medium hidden sm:block">
          Our shared space &amp; journey
        </p>
      </div>

      {/* Hero Couple Presence Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-white via-white to-[#FAF7F2]/60 border border-[#EAE6DE] shadow-xs text-center space-y-4 relative overflow-hidden">
        {/* Subtle decorative mesh background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FCEBEE] rounded-full blur-2xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#FFFBF0] rounded-full blur-2xl opacity-60 pointer-events-none" />

        {/* Dual Avatars with Linked Connector */}
        <div className="relative flex items-center justify-center pt-2">
          {/* Connecting subtle line */}
          <div className="absolute w-20 h-0.5 bg-gradient-to-r from-[#EAE6DE] via-[#D4AF37]/50 to-[#EAE6DE]" />

          {/* User Avatar */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-1 rounded-2xl bg-white shadow-sm ring-1 ring-[#EAE6DE]">
              <Avatar
                avatar={data.user.avatar}
                name={data.user.name}
                size="lg"
                fallback="👤"
                className="w-14 h-14 rounded-xl bg-[#FAF7F2]"
              />
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-[#1E1A18] max-w-[80px] truncate">
              {data.user.name}
            </span>
          </div>

          {/* Connector Badge */}
          <div className="relative z-20 mx-2 w-8 h-8 rounded-full bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-center text-xs font-serif italic text-[#756963]">
            &amp;
          </div>

          {/* Partner Avatar */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-1 rounded-2xl bg-white shadow-sm ring-1 ring-[#EAE6DE]">
              <Avatar
                avatar={data.partner?.avatar}
                name={partnerName}
                size="lg"
                fallback="✦"
                className="w-14 h-14 rounded-xl bg-[#FAF7F2]"
              />
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-[#1E1A18] max-w-[80px] truncate">
              {partnerName}
            </span>
          </div>
        </div>

        {/* Couple Title */}
        <div className="space-y-0.5">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1A18] tracking-tight">
            {data.user.name} &amp; {partnerName}
          </h2>
          <p className="text-xs text-[#756963]">
            Our shared space &amp; sanctuary.
          </p>
        </div>

        {/* Simple & Clear Live Presence Sub-bar */}
        <div className="pt-3 border-t border-[#EAE6DE]/80 grid grid-cols-2 gap-2 text-left">
          <div className="p-2.5 rounded-2xl bg-[#FAF7F2]/80 border border-[#EAE6DE]/60 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756963] truncate mr-1.5">
              {data.user.name}
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs shrink-0 ${
                userPresence.isOnline ? "text-[#557567] font-bold" : "text-[#756963] font-medium"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  userPresence.isOnline ? "bg-[#7E9F85] animate-pulse" : "bg-[#C5BCB5]"
                }`}
              />
              <span>{userPresence.text}</span>
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#FAF7F2]/80 border border-[#EAE6DE]/60 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756963] truncate mr-1.5">
              {partnerName}
            </span>
            {data.partner ? (
              <span
                className={`flex items-center gap-1.5 text-xs shrink-0 ${
                  partnerPresence.isOnline ? "text-[#557567] font-bold" : "text-[#756963] font-medium"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    partnerPresence.isOnline ? "bg-[#7E9F85] animate-pulse" : "bg-[#C5BCB5]"
                  }`}
                />
                <span>{partnerPresence.text}</span>
              </span>
            ) : (
              <span className="text-[11px] text-[#A89F99]">Not linked</span>
            )}
          </div>
        </div>
      </div>

      {/* Points Snapshot with Elevated Micro-Spring Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* User Card */}
        <div className="bg-white p-4 rounded-3xl border border-[#EAE6DE] shadow-2xs flex flex-col justify-between transition-all hover:border-[#AB3B46]/30">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#756963]">
              My Points
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#AB3B46] mt-0.5 tracking-tight">
              {data.user.pointBalance} <span className="text-xs font-sans font-medium text-[#756963]">pts</span>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setBonusTarget("self");
                setBonusMode("add");
                setBonusModalOpen(true);
              }}
              className="py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#FCEBEE] text-[#AB3B46] hover:text-[#BA3F4A] border border-[#EAE6DE] text-xs font-bold transition-all flex items-center justify-center shadow-2xs active:scale-95"
            >
              + Add
            </button>
            <button
              type="button"
              onClick={() => {
                setBonusTarget("self");
                setBonusMode("remove");
                setBonusModalOpen(true);
              }}
              className="py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-red-50 text-[#756963] hover:text-red-700 border border-[#EAE6DE] text-xs font-bold transition-all flex items-center justify-center shadow-2xs active:scale-95"
            >
              − Deduct
            </button>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-white p-4 rounded-3xl border border-[#EAE6DE] shadow-2xs flex flex-col justify-between transition-all hover:border-[#1E1A18]/20">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#756963] truncate">
              {partnerName}&apos;s Points
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1A18] mt-0.5 tracking-tight">
              {data.partner?.pointBalance ?? 0} <span className="text-xs font-sans font-medium text-[#756963]">pts</span>
            </div>
          </div>
          {data.partner ? (
            <div className="mt-3.5 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setBonusTarget("partner");
                  setBonusMode("add");
                  setBonusModalOpen(true);
                }}
                className="py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#FCEBEE] text-[#AB3B46] hover:text-[#BA3F4A] border border-[#EAE6DE] text-xs font-bold transition-all flex items-center justify-center shadow-2xs active:scale-95"
              >
                + Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setBonusTarget("partner");
                  setBonusMode("remove");
                  setBonusModalOpen(true);
                }}
                className="py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-red-50 text-[#756963] hover:text-red-700 border border-[#EAE6DE] text-xs font-bold transition-all flex items-center justify-center shadow-2xs active:scale-95"
              >
                − Deduct
              </button>
            </div>
          ) : (
            <div className="mt-3.5 py-1.5 text-center text-[11px] text-[#A89F99] font-medium">
              Not linked
            </div>
          )}
        </div>
      </div>

      {/* Couple Streak Card - Luxury Gold Foil Accent */}
      <div
        onClick={() => setStreakModalOpen(true)}
        className="bg-gradient-to-r from-white via-white to-[#FFFBF0] p-4 sm:p-5 rounded-3xl border border-[#FEF3D6] shadow-xs cursor-pointer hover:border-[#D4AF37] transition-all flex items-center justify-between group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <FlameIcon size={24} />
          </div>
          <div>
            <div className="font-serif text-base sm:text-lg font-bold text-[#1E1A18] flex items-center gap-1.5">
              <span>{data.couple.streakCount}-Day Couple Streak</span>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#FFFBF0] px-2 py-0.5 rounded-full border border-[#FEF3D6]">
                Active
              </span>
            </div>
            <p className="text-xs text-[#756963] mt-0.5 leading-relaxed">
              Every day you do something for each other counts.
            </p>
          </div>
        </div>
        <span className="w-8 h-8 rounded-full bg-[#FAF7F2] text-[#756963] group-hover:text-[#1E1A18] flex items-center justify-center text-sm font-bold shrink-0 transition-colors">
          ›
        </span>
      </div>

      {/* Connected Partner Space Status */}
      {data.partner ? (
        <div className="bg-white rounded-3xl p-4 border border-[#EAE6DE] shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#7E9F85] shadow-xs shrink-0" />
              <div>
                <div className="font-bold text-[#1E1A18]">
                  Connected with {partnerName}
                </div>
                <div className="text-[11px] text-[#756963]">
                  Space code: <span className="font-mono font-bold text-[#1E1A18]">{data.couple.inviteCode}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FCEBEE] hover:text-[#AB3B46] rounded-xl text-xs font-bold transition-all text-[#756963] active:scale-95 border border-[#EAE6DE]"
            >
              {copied ? "Copied! ✓" : "Copy Code"}
            </button>
          </div>

          <div className="pt-2.5 border-t border-[#EAE6DE]/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#756963]">
              <span>Phone Alerts:</span>
              {data.partner.hasPushEnabled ? (
                <span className="inline-flex items-center gap-1 font-bold text-[#557567] bg-[#F4F7F5] border border-[#E5EEE9] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7E9F85]" />
                  Active 🔔
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-[#A89F99] bg-[#FAF7F2] border border-[#EAE6DE] px-2 py-0.5 rounded-full" title="Partner hasn't enabled phone notifications in Pairly yet">
                  Not enabled yet 🔕
                </span>
              )}
            </div>

            {data.partner.latestNotification && (
              <div className="text-[#756963] truncate max-w-[170px]" title={data.partner.latestNotification.title}>
                Last alert:{" "}
                {data.partner.latestNotification.readAt ? (
                  <span className="text-[#557567] font-semibold">Seen ✓</span>
                ) : (
                  <span className="text-[#D4AF37] font-semibold">Delivered</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#EAE6DE]/60">
            <button
              type="button"
              onClick={() => setWhispersOpen(true)}
              className="w-full py-2 bg-gradient-to-r from-[#FFF5F6] via-white to-[#FFFBF0] hover:border-[#E06D75]/40 border border-[#FEF3D6] rounded-2xl text-xs font-bold text-[#E06D75] flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>💌</span>
              <span>Send Whisper or Nudge to {partnerName}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 border border-[#EAE6DE] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#1E1A18]">Pairing Sync Code</div>
              <div className="text-[11px] text-[#756963]">Waiting for your partner to link</div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FCEBEE] hover:text-[#AB3B46] rounded-xl text-xs font-bold transition-all text-[#1E1A18] active:scale-95 border border-[#EAE6DE]"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] font-mono text-center font-bold tracking-widest text-[#AB3B46] text-base select-all">
            {data.couple.inviteCode}
          </div>
        </div>
      )}

      {/* Profile & Settings Details */}
      <div className="bg-white rounded-3xl border border-[#EAE6DE] shadow-2xs divide-y divide-[#EAE6DE]/60 text-xs overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              avatar={data.user.avatar}
              name={data.user.name}
              size="md"
              fallback="👤"
              className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE]"
            />
            <div className="min-w-0">
              <div className="font-bold text-[#1E1A18] truncate">{data.user.name}</div>
              <div className="text-[11px] text-[#756963] truncate">{data.user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FCEBEE] hover:text-[#AB3B46] text-[#1E1A18] rounded-xl text-xs font-bold border border-[#EAE6DE] transition-all shrink-0 ml-2 active:scale-95"
          >
            Edit Profile
          </button>
        </div>

        <div
          className="p-4 flex items-center justify-between hover:bg-[#FAF7F2]/60 cursor-pointer transition-colors border-b border-[#EAE6DE]/60"
          onClick={() => setToastMessage("Daily 9:00 PM reminder is active")}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#756963]">Daily</span>
            <span className="font-semibold text-[#1E1A18]">Reminder</span>
          </div>
          <span className="text-[#557567] font-bold bg-[#F4F7F5] border border-[#E5EEE9] px-2 py-0.5 rounded-full text-[11px]">
            9:00 PM
          </span>
        </div>

        {/* PWA App Download / Installed Row */}
        {isStandalone ? (
          <div className="p-4 flex items-center justify-between border-b border-[#EAE6DE]/60">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-[#756963]">App</span>
              <span className="font-semibold text-[#1E1A18]">Installed on Phone</span>
            </div>
            <span className="text-[#557567] font-bold bg-[#F4F7F5] border border-[#E5EEE9] px-2 py-0.5 rounded-full text-[11px]">
              Installed ✓
            </span>
          </div>
        ) : (
          <div
            className="p-4 flex items-center justify-between hover:bg-[#FAF7F2]/60 cursor-pointer transition-colors border-b border-[#EAE6DE]/60"
            onClick={() => setInstallModalOpen(true)}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-[#756963]">App</span>
              <span className="font-semibold text-[#1E1A18]">Download Pairly App</span>
            </div>
            <span className="text-xs text-[#E06D75] font-bold flex items-center gap-1">
              Install ›
            </span>
          </div>
        )}

        {/* Device Notification Bar alerts toggle */}
        <DeviceNotificationToggle onToast={setToastMessage} />

        <div
          className="p-4 flex items-center justify-between hover:bg-red-50/60 cursor-pointer text-red-600 font-semibold transition-colors"
          onClick={async () => {
            document.cookie = "pairly_dev_user=; path=/; max-age=0";
            await signOut();
            router.push("/login");
          }}
        >
          <div className="flex items-center gap-2.5">
            <span>Sign Out</span>
          </div>
          <span className="text-stone-400">›</span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentName={data.user.name}
        currentAvatar={data.user.avatar}
        onUpdated={(newName, newAvatar) => {
          setData((prev) => ({
            ...prev,
            user: { ...prev.user, name: newName, avatar: newAvatar },
          }));
          setToastMessage("Profile updated");
        }}
      />

      {/* Streak Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streakCount={data.couple.streakCount}
      />

      {/* Clean Points Adjust Modal (Add or Deduct) */}
      <PointsAdjustModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        targetUserId={bonusTarget === "self" ? data.user.id : data.partner?.id || ""}
        targetName={bonusTarget === "self" ? "Myself" : partnerName}
        isSelf={bonusTarget === "self"}
        currentBalance={bonusTarget === "self" ? data.user.pointBalance : data.partner?.pointBalance || 0}
        initialMode={bonusMode}
        onSuccess={async (mode, amount) => {
          const who = bonusTarget === "self" ? "yourself" : partnerName;
          if (mode === "remove") {
            setToastMessage(`${amount} pts deducted from ${who}`);
          } else {
            setToastMessage(`${amount} pts given to ${who}`);
          }
          const r = await getCoupleState();
          if (r.success && r.data) setData(r.data as UsData);
        }}
      />

      {/* PWA Install Guide Modal */}
      <PwaInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        onInstalled={() => {
          setIsStandalone(true);
          setToastMessage("Pairly installed on your device");
        }}
      />

      {/* Whispers & Nudges Sheet */}
      <WhispersSheet
        isOpen={whispersOpen}
        onClose={() => setWhispersOpen(false)}
        partnerName={partnerName}
        onNudgeSent={setToastMessage}
      />

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
