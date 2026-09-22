"use client";

import React, { useState } from "react";
import { getRewards } from "@/actions/rewards";
import { useCart } from "@/lib/cart-context";
import { RewardDetailSheet } from "@/components/rewards/RewardDetailSheet";
import { MyOfferedRewardsModal } from "@/components/modals/MyOfferedRewardsModal";
import { Toast } from "@/components/ui/Toast";

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
}

export function RewardsClient({
  partnerName,
  initialAvailablePoints,
  initialPartnerRewards,
  initialMyOfferedRewards,
}: RewardsClientProps) {
  const { items, addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [allPartnerRewards, setAllPartnerRewards] = useState<RewardItem[]>(initialPartnerRewards);
  const [myOfferedRewards, setMyOfferedRewards] = useState<OfferedRewardItem[]>(initialMyOfferedRewards);
  const [availablePoints, setAvailablePoints] = useState(initialAvailablePoints);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMyRewardsOpen, setIsMyRewardsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayedRewards =
    selectedCategory === "ALL"
      ? allPartnerRewards
      : allPartnerRewards.filter((r) => r.category === selectedCategory);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleAddReward = (reward: { id: string; title: string; cost: number; icon: string }) => {
    addItem(reward);
    setToastMessage(`Added "${reward.title}" to your wish ✨`);
  };

  return (
    <div className="flex-1 p-4 pb-36 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#24201D]">
            Rewards
          </h1>
          <p className="text-xs text-[#756963]">Pick something you&apos;d love.</p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#FCEBEE] border border-[#FAD4DA] text-[#AB3B46] text-xs font-bold shadow-xs">
          <span>{availablePoints}</span> pts available
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 px-1">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full text-xs shrink-0 transition-all ${
                active
                  ? "bg-[#24201D] text-white font-semibold shadow-xs"
                  : "bg-white border border-[#EAE6DE] text-[#24201D] font-medium hover:border-[#E06D75]/40"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2-Column Reward Grid */}
      {displayedRewards.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-2 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center text-xl text-[#756963] mx-auto">
            ✦
          </div>
          <div className="font-serif text-base font-bold text-[#24201D]">
            No rewards in this category
          </div>
          <p className="text-xs text-[#756963]">
            {partnerName} hasn&apos;t added rewards for this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-1">
          {displayedRewards.map((reward) => {
            const isAdded = items.some((i) => i.rewardId === reward.id);
            return (
              <div
                key={reward.id}
                className="bg-white rounded-3xl p-3.5 border border-[#EAE6DE] hover:border-[#E06D75]/40 shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-200 group"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedReward(reward);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      {reward.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#807770] uppercase tracking-wider border border-[#EAE6DE]">
                      {reward.category}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#24201D] truncate group-hover:text-[#E06D75] transition-colors">
                    {reward.title}
                  </div>

                  <div className="text-xs font-bold text-[#E06D75] mt-0.5">
                    {reward.cost} pts
                  </div>

                  {reward.description && (
                    <div className="text-[10px] text-[#807770] mt-1 leading-relaxed line-clamp-2">
                      {reward.description}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddReward(reward)}
                  className={`mt-3 w-full py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 active:scale-95 shadow-2xs ${
                    isAdded
                      ? "bg-[#F0ECE1] text-[#756963] hover:bg-[#EAE6DE]"
                      : "bg-[#FAF7F2] hover:bg-[#E06D75] hover:text-white text-[#24201D] border border-[#EAE6DE] hover:border-transparent"
                  }`}
                >
                  <span>{isAdded ? "Added to Wishes ✓" : "+ Add to Wish"}</span>
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
          className="text-xs font-semibold text-[#756963] hover:text-[#E06D75] inline-flex items-center gap-1 underline underline-offset-4"
        >
          <span>Rewards you offer to {partnerName} →</span>
        </button>
      </div>

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
