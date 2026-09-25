"use client";

import React, { useState, useEffect } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { SparkHistoryItem, getSparkHistory } from "@/actions/spark";
import { BookOpenIcon } from "@/components/ui/Icons";

export interface SparkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName?: string;
}

export function SparkHistoryModal({
  isOpen,
  onClose,
  partnerName = "Partner",
}: SparkHistoryModalProps) {
  const [history, setHistory] = useState<SparkHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getSparkHistory()
      .then((res) => {
        if (res.success && res.history) {
          setHistory(res.history);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Spark Memories"
      subtitle={`Our unlocked answers & memories with ${partnerName}`}
    >
      <div className="space-y-4 py-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#756963]">
            Loading our memories...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-[#EAE6DE] space-y-2 p-6">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center mx-auto text-[#554B45]">
              <BookOpenIcon size={20} />
            </div>
            <p className="text-xs font-bold text-[#1E1A18]">No shared sparks yet</p>
            <p className="text-[11px] text-[#756963] max-w-[220px] mx-auto">
              Once you and {partnerName} both answer today&apos;s Daily Spark, it will be saved here forever!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-[#EAE6DE] shadow-2xs space-y-3"
              >
                {/* Header: Date + Category */}
                <div className="flex items-center justify-between text-[10px] text-[#756963]">
                  <span className="font-mono font-medium">{formatDate(item.date)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFFBF0] text-[#D4AF37] border border-[#FEF3D6] font-bold">
                    {item.category}
                  </span>
                </div>

                {/* Question */}
                <h4 className="font-serif text-sm font-bold text-[#1E1A18] leading-snug">
                  {item.question}
                </h4>

                {/* Answers Stack */}
                <div className="space-y-2 pt-1">
                  {/* Your Answer */}
                  <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE]/70 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963]">
                      You wrote:
                    </div>
                    <p className="text-xs text-[#1E1A18] leading-relaxed">
                      {item.myAnswer}
                    </p>
                  </div>

                  {/* Partner's Answer */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFF5F6] to-[#FFFBF0] border border-[#FEF3D6] space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#AB3B46]">
                      {partnerName} wrote:
                    </div>
                    <p className="text-xs text-[#1E1A18] leading-relaxed">
                      {item.partnerAnswer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
