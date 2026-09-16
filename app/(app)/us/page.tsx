"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { signOut } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { EditProfileModal } from "@/components/modals/EditProfileModal";
import { StreakModal } from "@/components/modals/StreakModal";
import { Toast } from "@/components/ui/Toast";

interface UsData {
  user: { id: string; name: string; email: string; avatar: string | null; pointBalance: number };
  couple: { id: string; name: string; inviteCode: string; streakCount: number };
  partner: { id: string; name: string; email: string; avatar: string | null; pointBalance: number } | null;
}

export default function UsPage() {
  const router = useRouter();
  const [data, setData] = useState<UsData | null>(null);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getCoupleState().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      } else {
        router.push("/onboarding/couple");
      }
    });
  }, [router]);

  const handleCopyCode = () => {
    if (data?.couple.inviteCode && navigator.clipboard) {
      navigator.clipboard.writeText(data.couple.inviteCode);
      setCopied(true);
      setToastMessage(`Space code ${data.couple.inviteCode} copied!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-[#E06D75] border-t-transparent animate-spin" />
      </div>
    );
  }

  const partnerName = data.partner?.name || "Partner";

  return (
    <div className="flex-1 p-4 sm:p-5 pb-24 space-y-4">
      {/* Top Header */}
      <div className="px-1">
        <h1 className="font-serif text-2xl font-bold text-[#24201D]">
          Us
        </h1>
        <p className="text-xs text-[#756963]">
          Our shared space.
        </p>
      </div>

      {/* Couple Card */}
      <div className="p-4 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs text-center space-y-2">
        <div className="flex items-center justify-center -space-x-3 pt-1">
          <Avatar
            avatar={data.user.avatar}
            name={data.user.name}
            size="lg"
            fallback="👤"
            className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border-2 border-white shadow-sm ring-1 ring-[#EAE6DE]"
          />
          <Avatar
            avatar={data.partner?.avatar}
            name={partnerName}
            size="lg"
            fallback="❤️"
            className="w-14 h-14 rounded-2xl bg-[#FCEBEE] border-2 border-white shadow-sm ring-1 ring-[#FAD4DA]"
          />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-[#24201D]">
            {data.user.name} &amp; {partnerName}
          </h2>
          <p className="text-xs text-[#756963] mt-0.5">
            Just the two of us.
          </p>
        </div>
      </div>

      {/* Couple Streak Card */}
      <div
        onClick={() => setStreakModalOpen(true)}
        className="bg-white p-4 rounded-3xl border border-[#EAE6DE] shadow-xs cursor-pointer hover:border-[#E06D75]/40 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] flex items-center justify-center text-2xl shrink-0">
            🔥
          </div>
          <div>
            <div className="font-serif text-base font-bold text-[#24201D]">
              {data.couple.streakCount}-Day Couple Streak
            </div>
            <p className="text-xs text-[#756963] mt-0.5">
              Every day you do something for each other counts.
            </p>
          </div>
        </div>
        <span className="text-[#807770] text-sm pr-1">›</span>
      </div>

      {/* Connected Partner Status */}
      {data.partner ? (
        <div className="bg-white rounded-2xl px-4 py-3 border border-[#EAE6DE] shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7E9F85] shadow-xs" />
            <div>
              <div className="font-semibold text-[#24201D]">
                Connected with {partnerName}
              </div>
              <div className="text-[11px] text-[#807770]">
                Space code: <span className="font-mono font-medium">{data.couple.inviteCode}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-2.5 py-1 bg-[#F5F2EB] hover:bg-[#FCEBEE] hover:text-[#E06D75] rounded-xl text-xs font-semibold transition-all text-[#756963]"
          >
            {copied ? "Copied! ✓" : "Copy Code"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-[#EAE6DE] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#24201D]">Pairing Sync Code</div>
              <div className="text-[11px] text-[#756963]">Waiting for partner to link</div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#FCEBEE] hover:text-[#E06D75] rounded-xl text-xs font-bold transition-all text-[#24201D]"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] font-mono text-center font-bold tracking-widest text-[#AB3B46] text-sm select-all">
            {data.couple.inviteCode}
          </div>
        </div>
      )}

      {/* Profile & Settings Details */}
      <div className="bg-white rounded-2xl border border-[#EAE6DE] shadow-sm divide-y divide-[#EAE6DE]/60 text-xs">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              avatar={data.user.avatar}
              name={data.user.name}
              size="md"
              fallback="👤"
              className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE6DE]"
            />
            <div className="min-w-0">
              <div className="font-semibold text-[#24201D] truncate">{data.user.name}</div>
              <div className="text-[10px] text-[#807770] truncate">{data.user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FCEBEE] hover:text-[#E06D75] text-[#24201D] rounded-xl text-xs font-semibold border border-[#EAE6DE] transition-all shrink-0 ml-2"
          >
            Edit Profile
          </button>
        </div>

        <div
          className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2]/60 cursor-pointer"
          onClick={() => setToastMessage("Daily 9:00 PM reminder is active ✨")}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔔</span>
            <span className="font-semibold text-[#24201D]">Daily Reminder</span>
          </div>
          <span className="text-[#557567] font-bold">9:00 PM</span>
        </div>

        <div
          className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2]/60 cursor-pointer text-red-600 font-semibold"
          onClick={async () => {
            document.cookie = "pairly_dev_user=; path=/; max-age=0";
            await signOut();
            router.push("/login");
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🚪</span>
            <span>Sign Out</span>
          </div>
          <span>›</span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentName={data.user.name}
        currentAvatar={data.user.avatar}
        onUpdated={(newName, newAvatar) => {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  user: { ...prev.user, name: newName, avatar: newAvatar },
                }
              : null
          );
          setToastMessage("Profile updated ✨");
        }}
      />

      {/* Streak Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streakCount={data.couple.streakCount}
      />

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
