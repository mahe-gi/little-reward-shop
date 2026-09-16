"use client";

import React, { useState } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { createReward } from "@/actions/rewards";

export interface OfferedRewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
}

export interface MyOfferedRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  offeredRewards: OfferedRewardItem[];
  onRewardCreated?: () => void;
}

export function MyOfferedRewardsModal({
  isOpen,
  onClose,
  partnerName,
  offeredRewards,
  onRewardCreated,
}: MyOfferedRewardsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(3);
  const [icon, setIcon] = useState("🎁");
  const [category, setCategory] = useState("LOVE");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await createReward(title, description, cost, icon, category);
    setLoading(false);

    if (res.success) {
      setTitle("");
      setDescription("");
      setShowAddForm(false);
      onRewardCreated?.();
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Rewards You Offer to ${partnerName}`}
      subtitle={`Create rewards ${partnerName} can choose with their points`}
    >
      <div className="space-y-3 py-1">
        {/* List of offered rewards */}
        <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar">
          {offeredRewards.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#807770]">
              You haven&apos;t added any offered rewards yet. Create something special for {partnerName}!
            </div>
          ) : (
            offeredRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-3 rounded-2xl bg-white border border-[#EAE6DE] flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{reward.icon}</span>
                  <div>
                    <div className="font-bold text-xs text-[#24201D]">{reward.title}</div>
                    <div className="text-[10px] text-[#756963] line-clamp-1">{reward.description}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#E06D75] shrink-0 ml-2">
                  {reward.cost} pts
                </span>
              </div>
            ))
          )}
        </div>

        {/* Add reward form / button */}
        {showAddForm ? (
          <form onSubmit={handleCreate} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] space-y-2.5 text-xs">
            <div>
              <label className="block font-semibold text-[#24201D] mb-1">Reward Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cozy Breakfast in Bed"
                className="w-full px-3 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#24201D] mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fluffy pancakes, fresh coffee & quiet morning"
                className="w-full px-3 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#24201D] mb-1">Cost (pts)</label>
                <input
                  type="number"
                  value={cost}
                  min={1}
                  max={50}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-2 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#24201D] mb-1">Icon</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-1.5 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs"
                >
                  <option value="❤️">❤️ Love</option>
                  <option value="💆‍♀️">💆‍♀️ Massage</option>
                  <option value="🍕">🍕 Food</option>
                  <option value="☕">☕ Coffee</option>
                  <option value="🍦">🍦 Gelato</option>
                  <option value="🎬">🎬 Movie</option>
                  <option value="🎮">🎮 Gaming</option>
                  <option value="🚲">🚲 Adventure</option>
                  <option value="🎁">🎁 Surprise</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#24201D] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-1.5 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs"
                >
                  <option value="LOVE">Love</option>
                  <option value="FOOD">Food</option>
                  <option value="DATES">Dates</option>
                  <option value="FUN">Fun</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <PillButton type="submit" variant="primary" size="sm" className="flex-1" loading={loading}>
                Offer Reward
              </PillButton>
              <PillButton type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </PillButton>
            </div>
          </form>
        ) : (
          <PillButton
            variant="secondary"
            size="md"
            className="w-full border-dashed border-[#E06D75]/40 text-[#E06D75] hover:bg-[#FDF6F7]"
            onClick={() => setShowAddForm(true)}
          >
            + Offer Reward
          </PillButton>
        )}
      </div>
    </ModalSheet>
  );
}
