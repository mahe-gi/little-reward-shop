"use client";

import React, { useState, useEffect } from "react";
import { getRewards } from "@/actions/rewards";
import { useCart } from "@/lib/cart-context";
import { RewardDetailSheet } from "@/components/rewards/RewardDetailSheet";
import { MyOfferedRewardsModal } from "@/components/modals/MyOfferedRewardsModal";
import { RequestsClient, RequestEntry } from "@/app/(app)/requests/RequestsClient";
import { Toast } from "@/components/ui/Toast";
import { triggerHaptic } from "@/lib/haptics";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";
import { RewardsIcon, MailIcon } from "@/components/ui/Icons";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: "LOVE" | "FOOD" | "DATES" | "FUN";
  cooldownHours?: number;
  offeredById: string;
}

interface OfferedRewardItem extends RewardItem {
  isActive: boolean;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "LOVE", label: "Love & Care" },
  { id: "FOOD", label: "Food & Treats" },
  { id: "DATES", label: "Dates" },
  { id: "FUN", label: "Fun" },
];

interface RewardsClientProps {
  partnerName: string;
  initialAvailablePoints: number;
  initialPartnerRewards: RewardItem[];
  initialMyOfferedRewards: OfferedRewardItem[];
  initialReceivedRequests?: RequestEntry[];
  initialSentRequests?: RequestEntry[];
}

export function RewardsClient({
  partnerName,
  initialAvailablePoints,
  initialPartnerRewards,
  initialMyOfferedRewards,
  initialReceivedRequests = [],
  initialSentRequests = [],
}: RewardsClientProps) {
  const { items, addItem } = useCart();
  const [hubTab, setHubTab] = useState<"coupons" | "wishes">("coupons");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [allPartnerRewards, setAllPartnerRewards] = useState<RewardItem[]>(initialPartnerRewards);
  const [myOfferedRewards, setMyOfferedRewards] = useState<OfferedRewardItem[]>(initialMyOfferedRewards);
  const [availablePoints] = useState(initialAvailablePoints);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMyRewardsOpen, setIsMyRewardsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with URL query parameter ?tab=wishes or ?tab=sent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "wishes" || params.get("tab") === "sent") {
        setHubTab("wishes");
      }
    }
  }, []);

  const pendingReceivedCount = initialReceivedRequests.filter(
    (r) => r.status === "PENDING"
  ).length;

  const displayedRewards =
    selectedCategory === "ALL"
      ? allPartnerRewards
      : allPartnerRewards.filter((r) => r.category === selectedCategory);

  const handleCategoryChange = (cat: string) => {
    triggerHaptic("light");
    setSelectedCategory(cat);
  };

  const handleAddReward = (reward: { id: string; title: string; cost: number; icon: string }) => {
    triggerHaptic("success");
    triggerCelebration({ type: "hearts", count: 25 });
    addItem(reward);
    setToastMessage(`Clipped "${reward.title}" to your wishes`);
  };

  return (
    <div className="flex-1 p-4 pb-36 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1E1A18]">
            Love Coupons &amp; Wishes
          </h1>
          <p className="text-xs text-[#554B45] font-medium">
            Treat each other with shared points &amp; surprises.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#FFF2F4] border border-[#FAD4DA] text-[#BA3F4A] text-xs font-bold shadow-2xs">
          <span>{availablePoints}</span> pts available
        </div>
      </div>

      {/* Primary Segmented Switch: Available Coupons vs Active Wishes */}
      <div className="p-1 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs flex gap-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic("selection");
            setHubTab("coupons");
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            hubTab === "coupons"
              ? "bg-[#1E1A18] text-white shadow-xs"
              : "text-[#554B45] hover:text-[#1E1A18] hover:bg-[#FAF7F2]"
          }`}
        >
          <RewardsIcon size={14} className={hubTab === "coupons" ? "text-white" : "text-[#554B45]"} />
          <span>Available Coupons</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("selection");
            setHubTab("wishes");
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            hubTab === "wishes"
              ? "bg-[#1E1A18] text-white shadow-xs"
              : "text-[#554B45] hover:text-[#1E1A18] hover:bg-[#FAF7F2]"
          }`}
        >
          <MailIcon size={14} className={hubTab === "wishes" ? "text-white" : "text-[#554B45]"} />
          <span>Active Wishes</span>
          {pendingReceivedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#BA3F4A] text-white text-[10px] font-bold animate-pulse">
              {pendingReceivedCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AVAILABLE COUPONS BOOKLET */}
      {hubTab === "coupons" && (
        <div className="space-y-4 animate-fade-in">
          {/* Category Filter Pills & Create Coupon Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 px-1 flex-1">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer ${
                      active
                        ? "bg-[#1E1A18] text-white font-semibold shadow-xs"
                        : "bg-white border border-[#EAE6DE] text-[#24201D] font-medium hover:border-[#BA3F4A]/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsMyRewardsOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] hover:bg-[#FFF2F4] text-[#BA3F4A] border border-[#EAE6DE] text-[11px] font-bold shrink-0 transition-all cursor-pointer active:scale-95"
            >
              + Offer
            </button>
          </div>

          {/* 2-Column Reward Voucher Grid */}
          {displayedRewards.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-2 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center text-xl text-[#554B45] mx-auto">
                ✦
              </div>
              <div className="font-serif text-base font-bold text-[#1E1A18]">
                No coupons in this category
              </div>
              <p className="text-xs text-[#554B45]">
                {partnerName} hasn&apos;t added coupons for this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-0.5">
              {displayedRewards.map((reward) => {
                const isAdded = items.some((i) => i.rewardId === reward.id);
                return (
                  <div
                    key={reward.id}
                    className="relative overflow-hidden bg-white rounded-3xl p-3 border border-[#EAE6DE] hover:border-[#BA3F4A]/40 shadow-[0_4px_16px_rgba(40,30,25,0.03)] hover:shadow-md flex flex-col justify-between transition-all duration-200 group"
                  >
                    {/* Top Voucher Body */}
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedReward(reward);
                        setIsDetailOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF2F4] border border-[#FAD4DA] flex items-center justify-center text-xl group-hover:scale-105 transition-transform shadow-2xs">
                          {reward.icon}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#554B45] uppercase tracking-wider border border-[#EAE6DE]">
                          {reward.category}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-serif font-bold text-[#1E1A18] truncate group-hover:text-[#BA3F4A] transition-colors">
                        {reward.title}
                      </div>

                      <div className="text-xs font-bold text-[#BA3F4A] mt-0.5 flex items-center gap-1">
                        <span>{reward.cost} pts</span>
                        <span className="text-[10px] text-[#A49B94] font-normal">• coupon</span>
                      </div>

                      {reward.description && (
                        <div className="text-[10px] text-[#554B45] mt-1 leading-relaxed line-clamp-2">
                          {reward.description}
                        </div>
                      )}
                    </div>

                    {/* Perforated Ticket Divider with Punched Side Notches */}
                    <div className="relative my-2.5 -mx-3 flex items-center pointer-events-none" aria-hidden="true">
                      <div className="w-2.5 h-4 bg-[#FAF7F2] rounded-r-full border-y border-r border-[#EAE6DE] shrink-0" />
                      <div className="flex-1 border-b border-dashed border-[#D8D2C7] mx-1 opacity-70" />
                      <div className="w-2.5 h-4 bg-[#FAF7F2] rounded-l-full border-y border-l border-[#EAE6DE] shrink-0" />
                    </div>

                    {/* Tear / Clip Action */}
                    <button
                      type="button"
                      onClick={() => handleAddReward(reward)}
                      className={`w-full py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 active:scale-95 shadow-2xs cursor-pointer ${
                        isAdded
                          ? "bg-[#F4F7F5] text-[#557567] border border-[#E5EEE9]"
                          : "bg-[#FAF7F2] hover:bg-[#BA3F4A] hover:text-white text-[#1E1A18] border border-[#EAE6DE] hover:border-transparent"
                      }`}
                    >
                      <span>{isAdded ? "Clipped" : "+ Clip to Wish"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer link to manage offered rewards */}
          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => setIsMyRewardsOpen(true)}
              className="text-xs font-semibold text-[#554B45] hover:text-[#BA3F4A] inline-flex items-center gap-1 underline underline-offset-4 cursor-pointer"
            >
              <span>Coupons you offer to {partnerName} →</span>
            </button>
          </div>
        </div>
      )}


      {/* TAB 2: ACTIVE WISHES TRACKING */}
      {hubTab === "wishes" && (
        <div className="animate-fade-in -mx-4 -mt-4">
          <RequestsClient
            initialReceived={initialReceivedRequests}
            initialSent={initialSentRequests}
            partnerName={partnerName}
          />
        </div>
      )}

      {/* Detail Sheet */}
      <RewardDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        reward={selectedReward}
        onAddToCart={handleAddReward}
      />

      {/* Offered Rewards Sheet */}
      <MyOfferedRewardsModal
        isOpen={isMyRewardsOpen}
        onClose={() => setIsMyRewardsOpen(false)}
        partnerName={partnerName}
        offeredRewards={myOfferedRewards}
        onRewardCreated={async () => {
          const res = await getRewards(selectedCategory);
          if (res.success && res.data) {
            setAllPartnerRewards(res.data.partnerRewards as unknown as RewardItem[]);
            setMyOfferedRewards(res.data.myOfferedRewards as unknown as OfferedRewardItem[]);
          }
        }}
      />

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
