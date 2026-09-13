"use client";

import React, { useState } from "react";
import { Reward, RewardCategory } from "@/types";
import { PrettyIcon } from "@/components/shared/PrettyIcon";

interface AdminRewardCatalogProps {
  rewards: Reward[];
  onCreateReward: (data: {
    title: string;
    description: string;
    points: number;
    emoji: string;
    category: RewardCategory;
    featured: boolean;
    fulfillmentInstructions?: string;
  }) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export function AdminRewardCatalog({
  rewards,
  onCreateReward,
  onToggleActive,
  isCreateModalOpen,
  onCloseCreateModal,
  onOpenCreateModal,
}: AdminRewardCatalogProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState(5);
  const [newEmoji, setNewEmoji] = useState("gift");
  const [newCategory, setNewCategory] = useState<RewardCategory>("Little Things");
  const [newFeatured, setNewFeatured] = useState(false);
  const [newFulfillment, setNewFulfillment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredRewards = rewards.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSaving(true);
    await onCreateReward({
      title: newTitle,
      description: newDesc,
      points: newPoints,
      emoji: newEmoji,
      category: newCategory,
      featured: newFeatured,
      fulfillmentInstructions: newFulfillment,
    });
    setIsSaving(false);
    onCloseCreateModal();
    // Reset form
    setNewTitle("");
    setNewDesc("");
    setNewPoints(5);
    setNewEmoji("gift");
    setNewFeatured(false);
    setNewFulfillment("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-warm-dark">Reward Catalog</h2>
          <p className="text-xs text-warm-subtle">
            Create and tune rewards available for her to unlock.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
        >
          <span>+ Create Reward</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rewards..."
          className="flex-1 px-3.5 py-2 bg-white border border-warm-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-romantic-400 text-warm-dark placeholder:text-warm-taupe"
        />

        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {["All", "Little Things", "Treats", "Experiences", "Special"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                categoryFilter === cat
                  ? "bg-warm-dark text-white font-semibold"
                  : "bg-white text-warm-subtle border border-warm-border hover:bg-warm-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRewards.map((reward) => (
          <div
            key={reward.id}
            className={`bg-white p-4 rounded-2xl border shadow-soft flex flex-col justify-between transition-all ${
              reward.active ? "border-warm-border" : "border-stone-200 opacity-60 bg-stone-50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-romantic-50 border border-romantic-100 flex items-center justify-center">
                  <PrettyIcon name={reward.emoji} size={20} />
                </div>
                <div className="flex items-center gap-1">
                  {reward.featured && (
                    <span className="text-[10px] bg-romantic-50 text-romantic-700 font-bold px-2 py-0.5 rounded border border-romantic-200">
                      Featured
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      reward.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {reward.active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
              <div className="font-bold text-sm text-warm-dark mt-2">{reward.title}</div>
              <div className="text-xs text-warm-subtle mt-0.5 line-clamp-2">
                {reward.description}
              </div>
              <div className="text-xs font-bold text-romantic-600 mt-2">
                {reward.points} {reward.points === 1 ? "point" : "points"} · {reward.category}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-warm-border flex justify-end gap-3 text-xs">
              <button
                onClick={() => onToggleActive(reward.id, !reward.active)}
                className={`font-semibold ${
                  reward.active
                    ? "text-rose-600 hover:text-rose-700"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                {reward.active ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE REWARD MODAL WITH LIVE PREVIEW */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-warm-border my-8">
            <h3 className="font-serif text-2xl font-bold text-warm-dark mb-1">
              Create New Reward
            </h3>
            <p className="text-xs text-warm-subtle mb-5">
              Add a new sweet treat or romantic experience to her shop.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-warm-dark mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Bike Lesson"
                      className="w-full px-3 py-2 border border-warm-border rounded-xl focus:outline-none focus:ring-2 focus:ring-romantic-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-warm-dark mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What makes this reward special?"
                      rows={2}
                      className="w-full px-3 py-2 border border-warm-border rounded-xl focus:outline-none focus:ring-2 focus:ring-romantic-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-warm-dark mb-1">Points</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={50}
                        value={newPoints}
                        onChange={(e) => setNewPoints(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-warm-border rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-romantic-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-warm-dark mb-1">Icon</label>
                      <input
                        type="text"
                        value={newEmoji}
                        onChange={(e) => setNewEmoji(e.target.value)}
                        placeholder="e.g. gift, heart, coffee"
                        className="w-full px-3 py-2 border border-warm-border rounded-xl text-center text-xs focus:outline-none focus:ring-2 focus:ring-romantic-400 font-medium"
                      />
                    </div>
                  </div>

                  {/* Icon Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {["gift", "heart", "coffee", "cookie", "rose", "film", "bike", "crown", "sparkles"].map(
                      (iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewEmoji(iconName)}
                          className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                            newEmoji === iconName
                              ? "bg-romantic-100 border-romantic-400"
                              : "bg-warm-cream/50 border-warm-border hover:bg-white"
                          }`}
                        >
                          <PrettyIcon name={iconName} size={16} />
                        </button>
                      )
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-warm-dark mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as RewardCategory)}
                      className="w-full px-3 py-2 border border-warm-border rounded-xl focus:outline-none focus:ring-2 focus:ring-romantic-400"
                    >
                      <option value="Little Things">Little Things</option>
                      <option value="Treats">Treats</option>
                      <option value="Experiences">Experiences</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="feat"
                      checked={newFeatured}
                      onChange={(e) => setNewFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-romantic-500 focus:ring-romantic-400"
                    />
                    <label htmlFor="feat" className="text-xs text-warm-dark font-medium">
                      Feature on Girlfriend Home Screen
                    </label>
                  </div>
                </div>

                {/* LIVE PREVIEW CARD */}
                <div className="flex flex-col justify-center">
                  <div className="text-[11px] font-bold uppercase text-warm-subtle mb-2 text-center">
                    Live Card Preview
                  </div>
                  <div className="bg-white rounded-2xl p-4 border-2 border-romantic-300 shadow-soft flex flex-col justify-between min-h-[160px] mx-auto w-full max-w-[220px]">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-romantic-50 border border-romantic-100 flex items-center justify-center mb-2">
                        <PrettyIcon name={newEmoji || "gift"} size={22} />
                      </div>
                      <div className="font-bold text-xs text-warm-dark line-clamp-1">
                        {newTitle || "Reward Title"}
                      </div>
                      <div className="text-[11px] text-warm-subtle mt-0.5 line-clamp-2 leading-tight">
                        &ldquo;{newDesc || "Description preview goes here..."}&rdquo;
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-warm-border flex items-center justify-between">
                      <span className="text-xs font-bold text-romantic-600">
                        {newPoints} {newPoints === 1 ? "pt" : "pts"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-romantic-50 text-romantic-700 font-semibold rounded">
                        Add
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-warm-border">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-romantic-500 hover:bg-romantic-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-soft transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Reward"}
                </button>
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2.5 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
