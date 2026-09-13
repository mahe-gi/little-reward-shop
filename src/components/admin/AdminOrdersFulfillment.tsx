"use client";

import React, { useState } from "react";
import { RedemptionOrder } from "@/types";
import { formatDate } from "@/lib/utils";
import { PartyPopper, Sparkles, ClipboardList, Check, CheckCircle2 } from "lucide-react";

interface AdminOrdersFulfillmentProps {
  orders: RedemptionOrder[];
  onApproveOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string, reason?: string) => Promise<void>;
  onToggleFulfillment: (fulfillmentItemId: string, completed: boolean) => Promise<void>;
  onCompleteOrder: (orderId: string) => Promise<void>;
}

export function AdminOrdersFulfillment({
  orders,
  onApproveOrder,
  onRejectOrder,
  onToggleFulfillment,
  onCompleteOrder,
}: AdminOrdersFulfillmentProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "fulfilling" | "completed" | "rejected">(
    "pending"
  );

  // Modal states
  const [approvingOrder, setApprovingOrder] = useState<RedemptionOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<RedemptionOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Let's save this for another day");
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const fulfillingOrders = orders.filter(
    (o) => o.status === "approved" || o.status === "fulfilling"
  );
  const completedOrders = orders.filter((o) => o.status === "completed");
  const rejectedOrders = orders.filter((o) => o.status === "rejected");

  const handleConfirmApprove = async () => {
    if (!approvingOrder) return;
    setIsProcessing(true);
    await onApproveOrder(approvingOrder.id);
    setIsProcessing(false);
    setApprovingOrder(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setIsProcessing(true);
    await onRejectOrder(rejectingOrder.id, rejectionReason);
    setIsProcessing(false);
    setRejectingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-warm-dark">
          Reward Orders & Fulfillment
        </h2>
        <p className="text-xs text-warm-subtle">
          Review requests, approve deductions, and complete the checklist when fulfilled.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex space-x-2 border-b border-warm-border pb-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "pending"
              ? "border-romantic-500 text-romantic-600"
              : "border-transparent text-warm-subtle hover:text-warm-dark"
          }`}
        >
          <span>Pending Requests</span>
          {pendingOrders.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("fulfilling")}
          className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === "fulfilling"
              ? "border-romantic-500 text-romantic-600"
              : "border-transparent text-warm-subtle hover:text-warm-dark"
          }`}
        >
          <span>Ready to Fulfill</span>
          {fulfillingOrders.length > 0 && (
            <span className="bg-romantic-100 text-romantic-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {fulfillingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "completed"
              ? "border-romantic-500 text-romantic-600"
              : "border-transparent text-warm-subtle hover:text-warm-dark"
          }`}
        >
          <span>Completed</span>
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "rejected"
              ? "border-romantic-500 text-romantic-600"
              : "border-transparent text-warm-subtle hover:text-warm-dark"
          }`}
        >
          <span>Declined</span>
        </button>
      </div>

      {/* SECTION 1: PENDING ORDERS */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-warm-border">
              <PartyPopper className="w-8 h-8 text-romantic-400 mx-auto mb-2" />
              <h4 className="font-serif text-base font-bold text-warm-dark">
                No Pending Requests!
              </h4>
              <p className="text-xs text-warm-subtle mt-0.5">
                You&apos;re completely caught up. Relax until her next wish arrives.
              </p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-soft"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-warm-border gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-warm-dark">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Waiting for Approval
                      </span>
                    </div>
                    <div className="text-xs text-warm-subtle mt-0.5">
                      Requested {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-serif text-lg font-bold text-warm-dark">
                      {order.totalPoints} points
                    </div>
                    <div className="text-[11px] text-warm-subtle">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </div>
                  </div>
                </div>

                <div className="py-3">
                  <div className="text-xs font-bold text-warm-dark mb-1.5">Requested Rewards:</div>
                  <div className="space-y-1 text-xs text-warm-subtle">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-warm-dark font-medium">
                          • {item.titleSnapshot} {item.quantity > 1 ? `×${item.quantity}` : ""}
                        </span>
                        <span className="text-romantic-600 font-semibold">
                          {item.pointsSnapshot * item.quantity} pts
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="mt-3 p-3 bg-romantic-50/50 rounded-xl border border-romantic-100 text-xs text-romantic-800 italic">
                      Her note: &ldquo;{order.note}&rdquo;
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-warm-border flex justify-end gap-2">
                  <button
                    onClick={() => setRejectingOrder(order)}
                    className="px-4 py-2 bg-white border border-warm-border hover:bg-rose-50 active:scale-95 text-rose-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={() => setApprovingOrder(order)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                  >
                    <span>Approve ({order.totalPoints} pts)</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 2: FULFILLING ORDERS & CHECKLIST */}
      {activeTab === "fulfilling" && (
        <div className="space-y-4">
          {fulfillingOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-warm-border">
              <Sparkles className="w-8 h-8 text-romantic-400 mx-auto mb-2" />
              <h4 className="font-serif text-base font-bold text-warm-dark">
                No Active Fulfillments
              </h4>
              <p className="text-xs text-warm-subtle mt-0.5">
                Approved orders ready to be fulfilled will appear here.
              </p>
            </div>
          ) : (
            fulfillingOrders.map((order) => {
              const completedCount = order.fulfillmentItems.filter((f) => f.completed).length;
              const totalCount = order.fulfillmentItems.length;
              const allDone = totalCount > 0 && completedCount === totalCount;

              return (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-3xl border-2 border-romantic-300 shadow-soft"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-warm-border gap-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-romantic-600" />
                      <div>
                        <h3 className="font-serif text-lg font-bold text-warm-dark">
                          Ready to Fulfill · {order.orderNumber}
                        </h3>
                        <p className="text-xs text-warm-subtle">
                          Check off items as you deliver her wishes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-romantic-700 bg-romantic-50 px-2.5 py-1 rounded-full border border-romantic-200">
                        {completedCount} of {totalCount} Completed
                      </span>
                      <span className="text-xs bg-romantic-100 text-romantic-800 font-bold px-2.5 py-1 rounded-full">
                        {order.totalPoints} points (Approved)
                      </span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2.5 my-4 text-xs font-medium text-warm-dark bg-warm-muted/60 p-4 rounded-2xl">
                    {order.fulfillmentItems.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl bg-white border cursor-pointer transition-all ${
                          item.completed
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-warm-border hover:border-romantic-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => onToggleFulfillment(item.id, e.target.checked)}
                            className="w-4 h-4 rounded text-romantic-500 focus:ring-romantic-400 cursor-pointer"
                          />
                          <span
                            className={
                              item.completed ? "line-through text-warm-subtle" : "text-warm-dark"
                            }
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.completed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-warm-muted text-warm-subtle"
                          }`}
                        >
                          {item.completed ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            "Pending"
                          )}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-warm-subtle">
                      Check all {totalCount} items to unlock the complete status button.
                    </p>
                    <button
                      onClick={() => onCompleteOrder(order.id)}
                      disabled={!allDone}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold shadow-soft transition-all flex items-center justify-center gap-1.5 ${
                        allDone
                          ? "bg-romantic-500 hover:bg-romantic-600 active:scale-95 text-white"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Mark Order Completed</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SECTION 3: COMPLETED ORDERS */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-3xl border border-warm-border shadow-soft p-5 space-y-3 text-xs">
          {completedOrders.length === 0 ? (
            <p className="text-center text-warm-subtle py-8">No completed orders yet.</p>
          ) : (
            completedOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between py-3 border-b border-warm-border last:border-0"
              >
                <div>
                  <div className="font-bold text-warm-dark">
                    {ord.orderNumber} · {ord.items.map((i) => i.titleSnapshot).join(", ")}
                  </div>
                  <div className="text-[11px] text-warm-subtle">
                    {ord.totalPoints} points · Delivered{" "}
                    {ord.completedAt ? formatDate(ord.completedAt) : "Recently"}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Delivered</span>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 4: REJECTED ORDERS */}
      {activeTab === "rejected" && (
        <div className="bg-white rounded-3xl border border-warm-border shadow-soft p-5 space-y-3 text-xs">
          {rejectedOrders.length === 0 ? (
            <p className="text-center text-warm-subtle py-8">No declined orders.</p>
          ) : (
            rejectedOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between py-3 border-b border-warm-border last:border-0"
              >
                <div>
                  <div className="font-bold text-warm-dark">
                    {ord.orderNumber} · {ord.items.map((i) => i.titleSnapshot).join(", ")}
                  </div>
                  <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                    Reason: &ldquo;{ord.rejectionReason}&rdquo;
                  </div>
                </div>
                <span className="text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full font-semibold">
                  0 pts deducted
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: APPROVE CONFIRMATION */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-warm-border text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-serif text-xl font-bold text-warm-dark">
              Approve this reward request?
            </h3>
            <p className="text-xs text-warm-subtle mt-1 px-2">
              <strong className="text-romantic-600 font-bold">
                {approvingOrder.totalPoints} points
              </strong>{" "}
              will be deducted from her balance, and fulfillment will begin.
            </p>

            <div className="my-3 p-3 bg-warm-muted rounded-2xl text-left text-xs space-y-1">
              <div className="font-bold text-warm-dark mb-1">
                Order {approvingOrder.orderNumber}:
              </div>
              {approvingOrder.items.map((i) => (
                <div key={i.id} className="text-warm-subtle">
                  • {i.titleSnapshot} ({i.pointsSnapshot} pts)
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={handleConfirmApprove}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Confirm & Deduct Points"}
              </button>
              <button
                onClick={() => setApprovingOrder(null)}
                className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT CONFIRMATION */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-warm-border">
            <h3 className="font-serif text-xl font-bold text-warm-dark">Decline Request</h3>
            <p className="text-xs text-warm-subtle mt-1 mb-3">
              No points will be deducted. Leave a gentle note for her:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full p-3 border border-warm-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-romantic-400 text-warm-dark"
            />

            <div className="space-y-2 mt-4">
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs shadow-soft transition-all disabled:opacity-50"
              >
                {isProcessing ? "Declining..." : "Decline Request"}
              </button>
              <button
                onClick={() => setRejectingOrder(null)}
                className="w-full py-2 text-xs text-warm-subtle hover:text-warm-dark font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
