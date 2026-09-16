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
import { getCoupleState } from "@/actions/couple";
import { PillButton } from "@/components/ui/PillButton";
import { Toast } from "@/components/ui/Toast";

interface RequestItem {
  id: string;
  rewardId: string;
  title: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  icon: string;
}

interface FulfillmentItem {
  id: string;
  label: string;
  completed: boolean;
}

interface RequestEntry {
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

export default function RequestsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"recv" | "sent">("recv");
  const [receivedRequests, setReceivedRequests] = useState<RequestEntry[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestEntry[]>([]);
  const [partnerName, setPartnerName] = useState("Partner");
  const [cancelModalWish, setCancelModalWish] = useState<RequestEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if URL specifies tab=sent
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "sent") {
        setTab("sent");
      }
    }
  }, []);

  const loadData = React.useCallback(async () => {
    const coupleRes = await getCoupleState();
    if (coupleRes.success && coupleRes.data) {
      if (coupleRes.data.partner) {
        setPartnerName(coupleRes.data.partner.name);
      }
    } else {
      router.push("/onboarding/couple");
      return;
    }

    const res = await getRequests();
    if (res.success && res.data) {
      setReceivedRequests(res.data.receivedRequests as unknown as RequestEntry[]);
      setSentRequests(res.data.sentRequests as unknown as RequestEntry[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (requestId: string) => {
    const res = await approveRewardRequest(requestId);
    if (res.success) {
      setToastMessage("Wish approved ❤️");
      loadData();
    } else {
      setToastMessage(res.error || "Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    const res = await rejectRewardRequest(requestId, "Rescheduled with love");
    if (res.success) {
      setToastMessage(`Wish declined. Points returned to ${partnerName}.`);
      loadData();
    }
  };

  const handleCancel = async (requestId: string) => {
    const res = await cancelRewardRequest(requestId);
    if (res.success) {
      setToastMessage("Wish cancelled. Your reserved points were returned.");
      loadData();
    } else {
      setToastMessage(res.error || "Failed to cancel request");
    }
  };

  const handleToggleChecklist = async (
    requestId: string,
    itemId: string,
    completed: boolean
  ) => {
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
      loadData();
    }
  };

  const handleFulfill = async (requestId: string) => {
    const res = await fulfillRewardRequest(requestId);
    if (res.success) {
      setToastMessage("Wish fulfilled ❤️");
      loadData();
    } else {
      setToastMessage(res.error || "Failed to complete fulfillment");
    }
  };

  return (
    <div className="flex-1 p-4 pb-24 space-y-3.5">
      {/* Top Header */}
      <div className="px-1">
        <h1 className="font-serif text-2xl font-bold text-[#24201D]">
          Requests
        </h1>
        <p className="text-xs text-[#756963]">
          Wishes waiting for each other.
        </p>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex p-1 rounded-2xl bg-white border border-[#EAE6DE] shadow-2xs">
        <button
          type="button"
          onClick={() => setTab("recv")}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === "recv"
              ? "bg-[#24201D] text-white shadow-xs"
              : "text-[#756963] hover:text-[#24201D]"
          }`}
        >
          <span>From {partnerName}</span>
          {receivedRequests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E06D75] animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === "sent"
              ? "bg-[#24201D] text-white shadow-xs"
              : "text-[#756963] hover:text-[#24201D]"
          }`}
        >
          <span>Sent by Me</span>
          {sentRequests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E8A838]" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#E06D75] border-t-transparent animate-spin" />
        </div>
      ) : tab === "recv" ? (
        /* Received Tab */
        <div className="space-y-3">
          {receivedRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-2">
              <div className="text-3xl">💌</div>
              <div className="font-serif text-base font-bold text-[#24201D]">
                No wishes from {partnerName} yet
              </div>
              <p className="text-xs text-[#756963]">
                When {partnerName} chooses one of your rewards, it will appear here.
              </p>
            </div>
          ) : (
            receivedRequests.map((req) => {
              const hasChecklist = req.checklist.length > 0;
              const allChecked =
                hasChecklist && req.checklist.every((c) => c.completed);
              const checkedCount = req.checklist.filter((c) => c.completed).length;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-4 border border-[#FAD4DA] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#AB3B46] bg-[#FCEBEE] px-2 py-0.5 rounded-md border border-[#FAD4DA]">
                        Wants from You
                      </span>
                      <h3 className="font-serif text-base font-bold text-[#24201D] mt-1">
                        {req.items
                          .map((i) =>
                            i.quantity > 1
                              ? `${i.icon} ${i.title} (×${i.quantity})`
                              : `${i.icon} ${i.title}`
                          )
                          .join(" & ")}
                      </h3>
                      <p className="text-[11px] text-[#756963] mt-0.5">
                        {req.totalPoints} pts
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        req.status === "COMPLETED"
                          ? "bg-[#F4F7F5] text-[#557567] border-[#E5EEE9]"
                          : req.status === "FULFILLING" || req.status === "APPROVED"
                          ? "bg-[#FCEBEE] text-[#AB3B46] border-[#FAD4DA]"
                          : req.status === "REJECTED"
                          ? "bg-[#FAF7F2] text-[#807770] border-[#EAE6DE]"
                          : "bg-[#FFFBF0] text-[#8E5E1E] border-[#FEF3D6]"
                      }`}
                    >
                      {req.status === "COMPLETED"
                        ? "Fulfilled ❤️"
                        : req.status === "FULFILLING" || req.status === "APPROVED"
                        ? "Approved ❤️"
                        : req.status === "REJECTED"
                        ? "Declined"
                        : "Pending"}
                    </span>
                  </div>

                  {req.note && (
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-xs italic text-[#24201D] border border-[#EAE6DE]">
                      &ldquo;{req.note}&rdquo;
                    </div>
                  )}

                  {/* Fulfillment step if approved/fulfilling */}
                  {(req.status === "APPROVED" || req.status === "FULFILLING") && (
                    <div className="space-y-2 pt-1">
                      {hasChecklist ? (
                        <>
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#807770] uppercase tracking-wider">
                            <span>Checklist</span>
                            <span className="text-[#E06D75] font-bold">
                              {checkedCount} of {req.checklist.length} Done
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {req.checklist.map((item) => (
                              <label
                                key={item.id}
                                className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                                  item.completed
                                    ? "bg-[#FAF7F2]/60 border-[#EAE6DE]"
                                    : "bg-white border-[#EAE6DE] hover:border-[#E06D75]/40"
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
                                      : "text-[#24201D]"
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
                            disabled={!allChecked}
                            className="w-full mt-2"
                            onClick={() => handleFulfill(req.id)}
                          >
                            Mark Fulfilled ❤️
                          </PillButton>
                        </>
                      ) : (
                        <PillButton
                          variant="primary"
                          size="md"
                          className="w-full mt-1"
                          onClick={() => handleFulfill(req.id)}
                        >
                          Mark Fulfilled ❤️
                        </PillButton>
                      )}
                    </div>
                  )}

                  {/* Pending Approval Actions */}
                  {req.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <PillButton
                        variant="primary"
                        size="md"
                        className="flex-1"
                        onClick={() => handleApprove(req.id)}
                      >
                        Approve Wish ❤️
                      </PillButton>
                      <PillButton
                        variant="secondary"
                        size="md"
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
        /* Sent by Me Tab */
        <div className="space-y-3">
          {sentRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE6DE] space-y-2">
              <div className="text-3xl">🎁</div>
              <div className="font-serif text-base font-bold text-[#24201D]">
                No wishes requested yet
              </div>
              <p className="text-xs text-[#756963]">
                Pick something you&apos;d love from {partnerName}&apos;s rewards.
              </p>
              <PillButton
                variant="primary"
                size="sm"
                className="mt-2"
                onClick={() => router.push("/rewards")}
              >
                Browse Rewards
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
                  className="p-4 rounded-3xl bg-white border border-[#EAE6DE] shadow-xs space-y-3 transition-all"
                >
                  {/* Card Header: Items & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base font-bold text-[#24201D] leading-snug">
                        {req.items
                          .map((i) =>
                            i.quantity > 1
                              ? `${i.icon} ${i.title} (×${i.quantity})`
                              : `${i.icon} ${i.title}`
                          )
                          .join(" & ")}
                      </h3>

                      {/* State-specific explanatory copy */}
                      {isPending && (
                        <p className="text-xs text-[#756963] mt-1 leading-relaxed">
                          <span className="font-semibold text-[#E06D75]">
                            {req.totalPoints} pts reserved
                          </span>{" "}
                          · Waiting for {partnerName}
                        </p>
                      )}

                      {isFulfilling && (
                        <p className="text-xs text-[#756963] mt-1 leading-relaxed">
                          Your wish is ready to be fulfilled ·{" "}
                          <span className="font-semibold text-[#24201D]">
                            {req.totalPoints} pts spent on this wish
                          </span>
                        </p>
                      )}

                      {isCompleted && (
                        <p className="text-xs text-[#557567] mt-1 font-medium leading-relaxed">
                          Fulfilled by {partnerName} ❤️ · {req.totalPoints} pts spent
                        </p>
                      )}

                      {isRejected && (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-[#756963] leading-relaxed">
                            Declined · Your <span className="font-semibold text-[#24201D]">{req.totalPoints} pts</span> were released.
                          </p>
                          {req.rejectionReason && (
                            <p className="text-[11px] text-[#A89F99] italic">
                              &ldquo;{req.rejectionReason}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {isCancelled && (
                        <p className="text-xs text-[#756963] mt-1 leading-relaxed">
                          Cancelled · Your {req.totalPoints} pts were released.
                        </p>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${
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
                  </div>

                  {/* Optional Note */}
                  {req.note && (
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-xs italic text-[#24201D] border border-[#EAE6DE]">
                      &ldquo;{req.note}&rdquo;
                    </div>
                  )}

                  {/* Pending State Cancel Action */}
                  {isPending && (
                    <div className="pt-1 flex items-center justify-end border-t border-[#FAF7F2]">
                      <button
                        type="button"
                        onClick={() => setCancelModalWish(req)}
                        className="text-xs text-[#807770] hover:text-red-600 font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
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
              <h3 className="font-serif text-lg font-bold text-[#24201D]">Cancel this wish?</h3>
              <p className="text-xs text-[#756963] leading-relaxed">
                Your <span className="font-semibold text-[#24201D]">{cancelModalWish.totalPoints} pts</span> will be returned to your points balance.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalWish(null)}
                className="flex-1 py-2 rounded-xl bg-[#FAF7F2] text-xs font-semibold text-[#24201D] border border-[#EAE6DE] hover:bg-stone-100 transition-colors"
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
