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

interface TaskPreset {
  id: string;
  title: string;
  points: number;
  note?: string;
}

const DEFAULT_PRESETS: TaskPreset[] = [
  { id: "p1", title: "6k Steps 👟", points: 6, note: "Hit 6,000 steps today!" },
  { id: "p2", title: "2.5L Water 💧", points: 1, note: "Stay hydrated & energized" },
  { id: "p3", title: "Eat Fruit 🍎", points: 10, note: "Enjoy fresh sweet fruits" },
  { id: "p4", title: "Eat Veggies 🥗", points: 5, note: "Nourish your body with veggies" },
];

export function GiveTaskSheet({
  isOpen,
  onClose,
  partnerName,
  onTaskGiven,
}: GiveTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(2);
  const [note, setNote] = useState("");
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [presets, setPresets] = useState<TaskPreset[]>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved custom presets from localStorage and combine with new default presets
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("pairly_task_presets_v2");
      if (saved) {
        setPresets(JSON.parse(saved));
      } else {
        // Migrate or set new defaults
        setPresets(DEFAULT_PRESETS);
        localStorage.setItem("pairly_task_presets_v2", JSON.stringify(DEFAULT_PRESETS));
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  const handleApplyPreset = (preset: TaskPreset) => {
    setTitle(preset.title);
    setPoints(preset.points);
    if (preset.note) setNote(preset.note);
    setError(null);
  };

  const handleDeletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    try {
      localStorage.setItem("pairly_task_presets_v2", JSON.stringify(updated));
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please name the task!");
      return;
    }

    // Save as preset if checked
    if (saveAsPreset && !presets.some((p) => p.title.toLowerCase() === title.trim().toLowerCase())) {
      const newPreset: TaskPreset = {
        id: "custom-" + Date.now(),
        title: title.trim(),
        points,
        note: note.trim() || undefined,
      };
      const updated = [newPreset, ...presets];
      setPresets(updated);
      try {
        localStorage.setItem("pairly_task_presets_v2", JSON.stringify(updated));
      } catch {}
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
      setSaveAsPreset(false);
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

        {/* Quick Presets Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-semibold text-[#24201D] text-[11px] uppercase tracking-wider">
              ⚡ Quick Presets (Tap to Fill)
            </label>
            <span className="text-[10px] text-[#807770]">Reusable habits</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {presets.map((p) => {
              const isSelected = title.trim().toLowerCase() === p.title.trim().toLowerCase();
              return (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-[#FCEBEE] text-[#AB3B46] border-[#E06D75] shadow-xs"
                      : "bg-[#FAF7F2] text-[#24201D] border-[#EAE6DE] hover:border-[#E06D75]/50"
                  }`}
                >
                  <span className="truncate max-w-[170px]">{p.title}</span>
                  <span className="text-[10px] opacity-75 font-bold">+{p.points}</span>
                  {p.id.startsWith("custom-") && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(e, p.id)}
                      className="ml-0.5 text-[#A89F99] hover:text-red-600 opacity-60 group-hover:opacity-100 text-[11px]"
                      title="Remove preset"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPoints((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl bg-white border border-[#EAE6DE] text-[#24201D] font-bold text-base flex items-center justify-center hover:border-[#E06D75] hover:text-[#E06D75] transition-all"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={points}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1) setPoints(v);
                else if (e.target.value === "") setPoints(1);
              }}
              className="flex-1 text-center px-2 py-2 bg-white border border-[#EAE6DE] rounded-xl text-sm font-bold text-[#24201D] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
            />
            <button
              type="button"
              onClick={() => setPoints((p) => p + 1)}
              className="w-9 h-9 rounded-xl bg-white border border-[#EAE6DE] text-[#24201D] font-bold text-base flex items-center justify-center hover:border-[#E06D75] hover:text-[#E06D75] transition-all"
            >
              +
            </button>
          </div>
          <p className="text-[10px] text-[#A89F99] mt-1.5">Any amount — be fair & kind ❤️</p>
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

        {/* Save as preset checkbox */}
        <label className="flex items-center gap-2 px-1 cursor-pointer select-none text-[11px] text-[#756963] hover:text-[#24201D]">
          <input
            type="checkbox"
            checked={saveAsPreset}
            onChange={(e) => setSaveAsPreset(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#EAE6DE] text-[#E06D75] focus:ring-0 cursor-pointer accent-[#E06D75]"
          />
          <span>Save as preset for quick daily reuse ✨</span>
        </label>

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
