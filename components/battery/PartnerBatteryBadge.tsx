"use client";

import React, { useState } from "react";
import { triggerHaptic } from "@/lib/haptics";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { updateBatteryStatus } from "@/actions/battery";

export interface PartnerBatteryBadgeProps {
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  batteryUpdatedAt?: string | null;
  partnerName?: string;
  variant?: "pill" | "hero" | "compact";
  className?: string;
}

export function PartnerBatteryBadge({
  batteryLevel,
  isCharging = false,
  batteryUpdatedAt,
  partnerName = "Partner",
  variant = "pill",
  className = "",
}: PartnerBatteryBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [manualLevel, setManualLevel] = useState(batteryLevel ?? 80);
  const [manualCharging, setManualCharging] = useState(isCharging ?? false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // If no battery has ever been reported
  const hasData = typeof batteryLevel === "number" && batteryLevel >= 0;

  // Format relative time (e.g. "Just now", "5m ago", "2h ago")
  const getRelativeTime = (isoString?: string | null) => {
    if (!isoString) return null;
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return "Earlier";
  };

  const relativeTime = getRelativeTime(batteryUpdatedAt);
  const isLow = hasData && (batteryLevel ?? 100) <= 20;

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("selection");
    setModalOpen(true);
  };

  const handleSaveManual = async () => {
    setSaving(true);
    triggerHaptic("medium");
    try {
      await updateBatteryStatus(manualLevel, manualCharging);
      setSavedToast(true);
      setTimeout(() => {
        setSavedToast(false);
        setModalOpen(false);
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  // If Hero variant (e.g. on Home hero card)
  if (variant === "hero") {
    if (!hasData) return null;

    return (
      <>
        <button
          type="button"
          onClick={handleOpenModal}
          title={`${partnerName}'s battery: ${batteryLevel}% ${isCharging ? "(Charging)" : ""}`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer backdrop-blur-xs select-none active:scale-95 ${
            isCharging
              ? "bg-[#FEF3D6]/25 text-[#FFF4CC] border border-[#FEF3D6]/40 shadow-xs"
              : isLow
              ? "bg-[#FFCCD0]/30 text-[#FFE0E3] border border-[#FFCCD0]/40"
              : "bg-white/15 text-white/90 border border-white/20"
          } ${className}`}
        >
          <span>{isCharging ? "⚡" : isLow ? "🪫" : "🔋"}</span>
          <span>{batteryLevel}%</span>
          {isCharging && <span className="text-[9px] opacity-90 hidden sm:inline">⚡</span>}
        </button>

        <BatteryDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          partnerName={partnerName}
          batteryLevel={batteryLevel}
          isCharging={isCharging}
          relativeTime={relativeTime}
          manualLevel={manualLevel}
          setManualLevel={setManualLevel}
          manualCharging={manualCharging}
          setManualCharging={setManualCharging}
          onSaveManual={handleSaveManual}
          saving={saving}
          savedToast={savedToast}
        />
      </>
    );
  }

  // Pill variant (e.g. Us tab, presence row)
  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer select-none active:scale-95 ${
          hasData
            ? isCharging
              ? "bg-[#FFFBF0] text-[#D4AF37] border border-[#FEF3D6]"
              : isLow
              ? "bg-[#FFF5F6] text-[#AB3B46] border border-[#FCDADF]"
              : "bg-[#FAF7F2] text-[#554B45] border border-[#EAE6DE]"
            : "bg-[#FAF7F2] text-[#756963] border border-[#EAE6DE] opacity-80"
        } ${className}`}
      >
        <span>
          {hasData ? (isCharging ? "⚡" : isLow ? "🪫" : "🔋") : "🔋"}
        </span>
        <span>
          {hasData ? `${batteryLevel}%` : "Battery"}
        </span>
        {hasData && isCharging && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
            Charging
          </span>
        )}
      </button>

      <BatteryDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        partnerName={partnerName}
        batteryLevel={batteryLevel}
        isCharging={isCharging}
        relativeTime={relativeTime}
        manualLevel={manualLevel}
        setManualLevel={setManualLevel}
        manualCharging={manualCharging}
        setManualCharging={setManualCharging}
        onSaveManual={handleSaveManual}
        saving={saving}
        savedToast={savedToast}
      />
    </>
  );
}

function BatteryDetailModal({
  isOpen,
  onClose,
  partnerName,
  batteryLevel,
  isCharging,
  relativeTime,
  manualLevel,
  setManualLevel,
  manualCharging,
  setManualCharging,
  onSaveManual,
  saving,
  savedToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  relativeTime: string | null;
  manualLevel: number;
  setManualLevel: (lvl: number) => void;
  manualCharging: boolean;
  setManualCharging: (ch: boolean) => void;
  onSaveManual: () => void;
  saving: boolean;
  savedToast: boolean;
}) {
  const [showManualForm, setShowManualForm] = useState(false);
  const hasData = typeof batteryLevel === "number" && batteryLevel >= 0;

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Phone Battery Status"
      subtitle={`See ${partnerName}'s charging level in real time`}
    >
      <div className="space-y-4 py-2">
        {/* Partner Current Status Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-[#FFFDF9] to-[#FFFBF0] border border-[#FEF3D6] shadow-2xs text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#FEF3D6] flex items-center justify-center text-3xl mx-auto shadow-2xs">
            {isCharging ? "⚡" : (batteryLevel ?? 100) <= 20 ? "🪫" : "🔋"}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#756963]">
              {partnerName}&apos;s Phone
            </div>
            <div className="font-serif text-3xl font-extrabold text-[#1E1A18] tracking-tight mt-0.5">
              {hasData ? `${batteryLevel}%` : "Not synced yet"}
            </div>
            {hasData && (
              <div className="text-xs font-semibold text-[#D4AF37] mt-0.5">
                {isCharging ? "Plugged in & Charging ⚡" : "Not charging"}
              </div>
            )}
          </div>

          {relativeTime && (
            <p className="text-[10px] text-[#A89F99]">
              Last updated: {relativeTime}
            </p>
          )}

          {hasData && (batteryLevel ?? 100) <= 20 && !isCharging && (
            <div className="p-2 rounded-xl bg-[#FFF5F6] border border-[#FCDADF] text-[11px] text-[#AB3B46] font-semibold">
              ⚠️ Phone is low on battery ({batteryLevel}%). It might shut off soon!
            </div>
          )}
        </div>

        {/* Info Explainer */}
        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] text-xs text-[#554B45] space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-[#1E1A18]">
            <span>✨</span>
            <span>How Battery Sync Works</span>
          </div>
          <p className="text-[11px] text-[#756963] leading-relaxed">
            On Android phones and PWAs, Pairly automatically syncs battery and charging status whenever the app is open. On iPhones, Apple limits automatic reading, so you can also update it with 1 tap below!
          </p>
        </div>

        {/* Manual Quick Updater Drawer (Useful for iOS or quick ping) */}
        {!showManualForm ? (
          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#EAE6DE] hover:border-[#AB3B46] text-xs font-semibold text-[#554B45] hover:text-[#AB3B46] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <span>📱 Update my own battery status</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs space-y-3 text-left">
            <div className="text-xs font-bold text-[#1E1A18] flex items-center justify-between">
              <span>Set My Battery Level</span>
              <span className="font-mono text-sm font-bold text-[#AB3B46]">
                {manualLevel}%
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={manualLevel}
              onChange={(e) => setManualLevel(Number(e.target.value))}
              className="w-full accent-[#AB3B46] cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold text-[#554B45] flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualCharging}
                  onChange={(e) => setManualCharging(e.target.checked)}
                  className="rounded text-[#AB3B46] focus:ring-[#AB3B46]"
                />
                <span>Currently Charging ⚡</span>
              </label>

              <PillButton
                variant="primary"
                size="sm"
                onClick={onSaveManual}
                loading={saving}
              >
                {savedToast ? "Saved! ✓" : "Save Status"}
              </PillButton>
            </div>
          </div>
        )}

        <PillButton variant="secondary" size="md" className="w-full" onClick={onClose}>
          Close
        </PillButton>
      </div>
    </ModalSheet>
  );
}
