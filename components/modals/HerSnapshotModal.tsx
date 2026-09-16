"use client";

import React from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { Avatar } from "@/components/ui/Avatar";

export interface HerSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    name: string;
    avatar: string | null;
    pointBalance: number;
  } | null;
  tasksCompletedThisWeek?: number;
}

export function HerSnapshotModal({
  isOpen,
  onClose,
  partner,
  tasksCompletedThisWeek = 0,
}: HerSnapshotModalProps) {
  if (!partner) return null;

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-3.5 py-2">
        <Avatar
          avatar={partner.avatar}
          fallback="❤️"
          size="lg"
          className="w-16 h-16 rounded-2xl bg-[#FCEBEE] border border-[#FAD4DA] mx-auto shadow-sm"
        />

        <div>
          <h3 className="font-serif text-xl font-bold text-[#24201D]">
            {partner.name}&apos;s Journey
          </h3>
          <p className="text-xs text-[#756963] mt-0.5">Connected Partner</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left bg-white p-3.5 rounded-2xl border border-[#EAE6DE]">
          <div>
            <span className="text-[#807770] block text-[10px] uppercase font-bold tracking-wider">
              WALLET BALANCE
            </span>
            <span className="font-serif text-2xl font-bold text-[#E06D75]">
              {partner.pointBalance} pts
            </span>
          </div>
          <div>
            <span className="text-[#807770] block text-[10px] uppercase font-bold tracking-wider">
              HABITS THIS WEEK
            </span>
            <span className="font-serif text-2xl font-bold text-[#24201D]">
              {tasksCompletedThisWeek} finished ✨
            </span>
          </div>
        </div>

        <PillButton variant="secondary" size="md" className="w-full" onClick={onClose}>
          Close
        </PillButton>
      </div>
    </ModalSheet>
  );
}
