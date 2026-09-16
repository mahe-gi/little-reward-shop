"use client";

import React, { useState } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { giveTask } from "@/actions/tasks";

export interface GiveTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  onTaskGiven?: (taskTitle: string, points: number) => void;
}

export function GiveTaskSheet({
  isOpen,
  onClose,
  partnerName,
  onTaskGiven,
}: GiveTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(2);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please name the task!");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await giveTask(title, points, note);
    setLoading(false);

    if (res.success) {
      onTaskGiven?.(title, points);
      setTitle("");
      setNote("");
      setPoints(2);
      onClose();
    } else {
      setError(res.error || "Failed to give task");
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Give ${partnerName} a Task`}
      subtitle="Something you'd love them to do."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block font-semibold text-[#24201D] mb-1">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 20 mins yoga or gentle evening walk"
            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6DE] rounded-xl text-xs text-[#24201D] placeholder-[#807770] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#24201D] mb-1.5">Points</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 5].map((pts) => {
              const selected = points === pts;
              return (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setPoints(pts)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selected
                      ? "bg-[#FCEBEE] border border-[#E06D75] text-[#AB3B46] shadow-sm"
                      : "bg-white border border-[#EAE6DE] text-[#756963] hover:border-[#E06D75]"
                  }`}
                >
                  +{pts} {pts === 1 ? "pt" : "pts"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#24201D] mb-1">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a little note..."
            className="w-full px-3.5 py-2.5 bg-white border border-[#EAE6DE] rounded-xl text-xs text-[#24201D] placeholder-[#807770] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
          />
        </div>

        <PillButton
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          loading={loading}
        >
          Give Task
        </PillButton>
      </form>
    </ModalSheet>
  );
}
