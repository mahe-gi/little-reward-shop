"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getRequests,
  approveRewardRequest,
  rejectRewardRequest,
  cancelRewardRequest,
  toggleChecklistItem,
  fulfillRewardRequest,
} from "@/actions/requests";
import { PillButton } from "@/components/ui/PillButton";
import { Toast } from "@/components/ui/Toast";
import { triggerHaptic } from "@/lib/haptics";
import { triggerCelebration } from "@/components/ui/CelebrationConfetti";

export interface RequestItem {
  id: string;
  rewardId: string;
  title: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  icon: string;
}

export interface FulfillmentItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface RequestEntry {
  id: string;
  totalPoints: number;
  totalCost: number;
  note: string | null;
  rejectionReason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "FULFILLING" | "COMPLETED";
  createdAt: string;
  items: RequestItem[];
  checklist: FulfillmentItem[];
}

export interface RequestsClientProps {
  initialReceived: RequestEntry[];
  initialSent: RequestEntry[];
  partnerName: string;
}

export function RequestsClient({
  initialReceived,
  initialSent,
  partnerName,
}: RequestsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"recv" | "sent">("recv");
  const [receivedRequests, setReceivedRequests] = useState<RequestEntry[]>(initialReceived);
  const [sentRequests, setSentRequests] = useState<RequestEntry[]>(initialSent);
  const [cancelModalWish, setCancelModalWish] = useState<RequestEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync with URL query param ?tab=sent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "sent") {
        setTab("sent");
      }
    }
  }, []);

  const refreshData = async () => {
    const res = await getRequests();
    if (res.success && res.data) {
      setReceivedRequests(res.data.receivedRequests as unknown as RequestEntry[]);
      setSentRequests(res.data.sentRequests as unknown as RequestEntry[]);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoadingId(requestId);
    triggerHaptic("success");
    triggerCelebration({ type: "hearts", count: 35 });
    const res = await approveRewardRequest(requestId);
    setActionLoadingId(null);
    if (res.success) {
      setToastMessage("Wish approved with love ❤️");
      refreshData();
    } else {
      setToastMessage(res.error || "Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    triggerHaptic("light");
    const res = await rejectRewardRequest(requestId, "Rescheduled with love");
    setActionLoadingId(null);
    if (res.success) {
      setToastMessage(`Wish declined. Points returned to ${partnerName}.`);
      refreshData();
    } else {
      setToastMessage(res.error || "Failed to decline request");
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoadingId(requestId);
    triggerHaptic("light");
    const res = await cancelRewardRequest(requestId);
    setActionLoadingId(null);
    if (res.success) {
      setToastMessage("Wish cancelled. Your reserved points were returned.");
      refreshData();
    } else {
      setToastMessage(res.error || "Failed to cancel request");
    }
  };

  const handleToggleChecklist = async (
    requestId: string,
    itemId: string,
    completed: boolean
  ) => {
    triggerHaptic("selection");
    // Optimistic update
    setReceivedRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              checklist: r.checklist.map((c) =>
                c.id === itemId ? { ...c, completed } : c
              ),
            }
          : r
      )
    );

    const res = await toggleChecklistItem(requestId, itemId, completed);
    if (!res.success) {
      setToastMessage(res.error || "Failed to update item");
      refreshData();
    }
  };

  const handleFulfill = async (requestId: string) => {
    setActionLoadingId(requestId);
    triggerHaptic("sparkUnlock");
    triggerCelebration({ type: "all", count: 65 });
    const res = await fulfillRewardRequest(requestId);
    setActionLoadingId(null);
    if (res.success) {
      setToastMessage("Wish completely fulfilled! ✨❤️");
      refreshData();
    } else {
      setToastMessage(res.error || "Failed to complete fulfillment");
    }
  };

  const pendingReceivedCount = receivedRequests.filter((r) => r.status === "PENDING").length;
  const pendingSentCount = sentRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="flex-1 p-4 sm:p-5 pb-28 space-y-4">
      {/* Editorial Page Header */}
      <div className="px-1 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#AB3B46]">
            Desires &amp; Surprises
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1E1A18] mt-0.5">
            Wishes
          </h1>
        </div>
        <p className="text-xs text-[#756963] font-medium hidden sm:block">
          Shared with love
        </p>
      </div>

      {/* Luxury Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#EAE6DE] shadow-2xs flex gap-1">
        <button
          type="button"
          onClick={() => setTab("recv")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            tab === "recv"
              ? "bg-[#1E1A18] text-[#FAF7F2] shadow-sm scale-[1.01]"
              : "text-[#756963] hover:text-[#1E1A18] hover:bg-[#FAF7F2]/60"
          }`}
        >
          <span>From {partnerName}</span>
          {pendingReceivedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#E06D75] text-white text-[10px] font-bold animate-pulse">
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            tab === "sent"
              ? "bg-[#1E1A18] text-[#FAF7F2] shadow-sm scale-[1.01]"
              : "text-[#756963] hover:text-[#1E1A18] hover:bg-[#FAF7F2]/60"
          }`}
        >
          <span>Sent by Me</span>
          {pendingSentCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold">
              {pendingSentCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      {tab === "recv" ? (
        /* RECEIVED TAB */
        <div className="space-y-3.5 animate-in fade-in duration-300">
          {receivedRequests.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white/80 rounded-3xl border border-[#EAE6DE] shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DE] flex items-center justify-center text-2xl mx-auto shadow-2xs">
                💌
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#1E1A18]">
                  No wishes from {partnerName} yet
                </h3>
                <p className="text-xs text-[#756963] max-w-xs mx-auto leading-relaxed">
                  When {partnerName} claims a treat from your boutique, it will appear here for your loving approval.
                </p>
              </div>
            </div>
          ) : (
            receivedRequests.map((req) => {
              const hasChecklist = req.checklist.length > 0;
              const allChecked =
                hasChecklist && req.checklist.every((c) => c.completed);
              const checkedCount = req.checklist.filter((c) => c.completed).length;
              const isPending = req.status === "PENDING";
              const isFulfilling = req.status === "FULFILLING" || req.status === "APPROVED";
              const isCompleted = req.status === "COMPLETED";
              const isRejected = req.status === "REJECTED";

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-[#FAD4DA] shadow-xs space-y-3.5 relative overflow-hidden transition-all hover:border-[#E06D75]/60"
                >
                  {/* Subtle decorative top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E06D75] via-[#FAD4DA] to-[#D4AF37]" />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#AB3B46] bg-[#FCEBEE] px-2 py-0.5 rounded-full border border-[#FAD4DA]">
                          Wants from You
                        </span>
                        <span className="text-[11px] font-bold text-[#D4AF37] px-2 py-0.5 bg-[#FFFBF0] rounded-full border border-[#FEF3D6]">
                          ✨ {req.totalPoints} pts
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#1E1A18] leading-snug">
                        {req.items
                          .map((i) =>
                            i.quantity > 1
                              ? `${i.icon} ${i.title} (×${i.quantity})`
                              : `${i.icon} ${i.title}`
                          )
                          .join(" & ")}
                      </h3>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isCompleted
                          ? "bg-[#F4F7F5] text-[#557567] border-[#E5EEE9]"
                          : isFulfilling
                          ? "bg-[#FCEBEE] text-[#AB3B46] border-[#FAD4DA]"
                          : isRejected
                          ? "bg-[#FAF7F2] text-[#807770] border-[#EAE6DE]"
                          : "bg-[#FFFBF0] text-[#8E5E1E] border-[#FEF3D6]"
                      }`}
                    >
                      {isCompleted
                        ? "Fulfilled ❤️"
                        : isFulfilling
                        ? "In Progress 💫"
                        : isRejected
                        ? "Declined"
                        : "Awaiting You"}
                    </span>
                  </div>

                  {/* Note block */}
                  {req.note && (
                    <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE]/80 text-xs italic text-[#1E1A18] leading-relaxed">
                      &ldquo;{req.note}&rdquo;
                    </div>
                  )}

                  {/* Checklist if in progress */}
                  {isFulfilling && (
                    <div className="space-y-2.5 pt-1">
                      {hasChecklist ? (
                        <>
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#756963] uppercase tracking-wider">
                            <span>Fulfillment Steps</span>
                            <span className="text-[#AB3B46] font-bold">
                              {checkedCount} / {req.checklist.length} Done
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {req.checklist.map((item) => (
                              <label
                                key={item.id}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                  item.completed
                                    ? "bg-[#FAF7F2]/60 border-[#EAE6DE] opacity-80"
                                    : "bg-white border-[#EAE6DE] hover:border-[#E06D75]/40 shadow-2xs"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) =>
                                    handleToggleChecklist(req.id, item.id, e.target.checked)
                                  }
                                  className="w-4 h-4 rounded text-[#E06D75] focus:ring-[#E06D75]"
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    item.completed
                                      ? "line-through text-[#807770]"
                                      : "text-[#1E1A18]"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </label>
                            ))}
                          </div>

                          <PillButton
                            variant="primary"
                            size="md"
                            disabled={!allChecked || actionLoadingId === req.id}
                            loading={actionLoadingId === req.id}
                            className="w-full mt-2 font-bold shadow-xs active:scale-95"
                            onClick={() => handleFulfill(req.id)}
                          >
                            Mark Fulfilled ❤️
                          </PillButton>
                        </>
                      ) : (
                        <PillButton
                          variant="primary"
                          size="md"
                          className="w-full mt-1 font-bold shadow-xs active:scale-95"
                          loading={actionLoadingId === req.id}
                          onClick={() => handleFulfill(req.id)}
                        >
                          Mark Fulfilled ❤️
                        </PillButton>
                      )}
                    </div>
                  )}

                  {/* Actions for Pending */}
                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <PillButton
                        variant="primary"
                        size="md"
                        className="flex-1 font-bold shadow-xs active:scale-95"
                        loading={actionLoadingId === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        Approve Wish ❤️
                      </PillButton>
                      <PillButton
                        variant="secondary"
                        size="md"
                        className="active:scale-95"
                        loading={actionLoadingId === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        Decline
                      </PillButton>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* SENT BY ME TAB */
        <div className="space-y-3.5 animate-in fade-in duration-300">
          {sentRequests.length === 0 ? (
            <div className="p-8 sm:p-10 text-center bg-white/80 rounded-3xl border border-[#EAE6DE] shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DE] flex items-center justify-center text-2xl mx-auto shadow-2xs">
                🎁
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#1E1A18]">
                  No wishes requested yet
                </h3>
                <p className="text-xs text-[#756963] max-w-xs mx-auto leading-relaxed">
                  Treat yourself to something sweet from {partnerName}&apos;s reward boutique.
                </p>
              </div>
              <PillButton
                variant="primary"
                size="md"
                className="mt-2 shadow-xs active:scale-95"
                onClick={() => router.push("/rewards")}
              >
                Browse Boutique →
              </PillButton>
            </div>
          ) : (
            sentRequests.map((req) => {
              const isPending = req.status === "PENDING";
              const isFulfilling = req.status === "FULFILLING" || req.status === "APPROVED";
              const isCompleted = req.status === "COMPLETED";
              const isRejected = req.status === "REJECTED";
              const isCancelled = req.status === "CANCELLED";

              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-3 transition-all hover:border-[#1E1A18]/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#756963] bg-[#FAF7F2] px-2 py-0.5 rounded-full border border-[#EAE6DE]">
                          My Request
                        </span>
                        <span className="text-[11px] font-bold text-[#AB3B46]">
                          {req.totalPoints} pts
                        </span>
                      </div>

                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#1E1A18] leading-snug">
                        {req.items
                          .map((i) =>
                            i.quantity > 1
                              ? `${i.icon} ${i.title} (×${i.quantity})`
                              : `${i.icon} ${i.title}`
                          )
                          .join(" & ")}
                      </h3>

                      {isPending && (
                        <p className="text-xs text-[#756963] leading-relaxed">
                          <span className="font-semibold text-[#AB3B46]">
                            {req.totalPoints} pts reserved
                          </span>{" "}
                          · Awaiting {partnerName}&apos;s review
                        </p>
                      )}

                      {isFulfilling && (
                        <p className="text-xs text-[#756963] leading-relaxed">
                          Approved by {partnerName} ❤️ ·{" "}
                          <span className="font-semibold text-[#1E1A18]">
                            {req.totalPoints} pts spent
                          </span>
                        </p>
                      )}

                      {isCompleted && (
                        <p className="text-xs text-[#557567] font-semibold leading-relaxed">
                          Fulfilled by {partnerName} ✨❤️
                        </p>
                      )}

                      {isRejected && (
                        <p className="text-xs text-[#756963] leading-relaxed">
                          Declined · Your <span className="font-semibold text-[#1E1A18]">{req.totalPoints} pts</span> were refunded.
                        </p>
                      )}

                      {isCancelled && (
                        <p className="text-xs text-[#756963] leading-relaxed">
                          Cancelled · Your {req.totalPoints} pts were returned.
                        </p>
                      )}
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isCompleted
                          ? "text-[#557567] bg-[#F4F7F5] border-[#E5EEE9]"
                          : isFulfilling
                          ? "text-[#AB3B46] bg-[#FCEBEE] border-[#FAD4DA]"
                          : isPending
                          ? "text-[#8E5E1E] bg-[#FFFBF0] border-[#FEF3D6]"
                          : "text-[#807770] bg-[#FAF7F2] border-[#EAE6DE]"
                      }`}
                    >
                      {isCompleted
                        ? "Fulfilled ❤️"
                        : isFulfilling
                        ? "Approved ❤️"
                        : isPending
                        ? "Pending"
                        : isRejected
                        ? "Declined"
                        : "Cancelled"}
                    </span>
                  </div>

                  {req.note && (
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-xs italic text-[#1E1A18] border border-[#EAE6DE]/80">
                      &ldquo;{req.note}&rdquo;
                    </div>
                  )}

                  {isPending && (
                    <div className="pt-2 flex justify-end border-t border-[#FAF7F2]">
                      <button
                        type="button"
                        onClick={() => setCancelModalWish(req)}
                        className="text-xs text-[#756963] hover:text-red-700 font-semibold transition-colors py-1 px-2.5 rounded-xl hover:bg-red-50"
                      >
                        Cancel Wish
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalWish && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full space-y-4 border border-[#EAE6DE] shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] flex items-center justify-center text-xl mx-auto">
              ↩️
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#1E1A18]">Cancel this wish?</h3>
              <p className="text-xs text-[#756963] leading-relaxed">
                Your <span className="font-semibold text-[#1E1A18]">{cancelModalWish.totalPoints} pts</span> will be returned to your balance.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalWish(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#1E1A18] border border-[#EAE6DE] hover:bg-[#F5F2EB] transition-colors"
              >
                Keep Wish
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = cancelModalWish.id;
                  setCancelModalWish(null);
                  await handleCancel(id);
                }}
                className="flex-1 py-2 rounded-xl bg-red-50 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Cancel Wish
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
