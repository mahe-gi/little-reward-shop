"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { getCoupleState } from "@/actions/couple";
import { submitRewardRequest } from "@/actions/requests";
import { calculateAvailablePoints } from "@/actions/wallet";
import { PillButton } from "@/components/ui/PillButton";
import { Toast } from "@/components/ui/Toast";
import { ArrowLeftIcon, HeartIcon, TrashIcon } from "@/components/ui/Icons";

export default function ReviewWishPage() {
  const router = useRouter();
  const { items, totalCost, totalCount, addItem, decrementItem, removeItem, clearCart } = useCart();

  const [partnerName, setPartnerName] = useState<string>("Partner");
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedWish, setSubmittedWish] = useState<{ totalPoints: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch live couple data and available points
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const coupleRes = await getCoupleState();
      if (!coupleRes.success || !coupleRes.data) {
        router.push("/onboarding/couple");
        return;
      }

      if (mounted) {
        if (coupleRes.data.partner) {
          setPartnerName(coupleRes.data.partner.name);
        }

        // Fetch real available points
        const ptsRes = await calculateAvailablePoints();
        if (ptsRes.success && ptsRes.data) {
          setAvailablePoints(ptsRes.data.availablePoints);
        } else {
          setAvailablePoints(coupleRes.data.user.pointBalance);
        }
        setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  const hasEnoughPoints = availablePoints >= totalCost;
  const pointsRemaining = Math.max(0, availablePoints - totalCost);
  const maxNoteLength = 250;

  const handleSendWish = async () => {
    if (items.length === 0 || !hasEnoughPoints || submitting) return;

    setSubmitting(true);
    const payload = items.map((i) => ({
      rewardId: i.rewardId,
      quantity: i.quantity,
    }));

    const res = await submitRewardRequest(payload, note);
    setSubmitting(false);

    if (res.success) {
      setSubmittedWish({ totalPoints: totalCost });
      clearCart();
    } else {
      setToastMessage(res.error || "Could not send wish. Please try again.");
    }
  };

  // SUCCESS STATE
  if (submittedWish) {
    return (
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between items-center text-center animate-in fade-in zoom-in-95 duration-500 min-h-[80vh]">
        <div className="pt-8 w-full max-w-sm mx-auto space-y-6">
          {/* Animated Heart Stamp */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#FDFBF7] to-[#FCEBEE] border border-[#FAD4DA] shadow-[0_12px_32px_rgba(224,109,117,0.22)] flex items-center justify-center mx-auto transition-transform animate-heartbeat">
            <HeartIcon size={44} className="text-[#E06D75] fill-[#E06D75]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-[#24201D] tracking-tight">
              Wish Sent ❤️
            </h1>
            <p className="text-sm text-[#756963] max-w-xs mx-auto leading-relaxed">
              <span className="font-semibold text-[#24201D]">{partnerName}</span> has your wish.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs max-w-xs mx-auto">
            <div className="text-xs text-[#756963] leading-relaxed">
              Your <span className="font-bold text-[#E06D75]">{submittedWish.totalPoints} pts</span> are safely reserved until {partnerName} responds.
            </div>
          </div>
        </div>

        <div className="w-full max-w-xs mx-auto space-y-2.5 pb-6">
          <PillButton
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-sm"
            onClick={() => router.push("/requests")}
          >
            View My Requests
          </PillButton>
          <button
            type="button"
            onClick={() => router.push("/rewards")}
            className="w-full py-2.5 text-xs font-semibold text-[#756963] hover:text-[#24201D] transition-colors"
          >
            Back to Rewards
          </button>
        </div>
      </div>
    );
  }

  // EMPTY WISH STATE
  if (!loading && items.length === 0) {
    return (
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between items-center text-center min-h-[80vh]">
        {/* Top Back bar */}
        <div className="w-full flex items-center pt-1">
          <button
            type="button"
            onClick={() => router.push("/rewards")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#756963] hover:text-[#24201D] py-1 px-2.5 rounded-xl hover:bg-[#F5F2EB] transition-colors"
          >
            <ArrowLeftIcon size={14} />
            <span>Rewards</span>
          </button>
        </div>

        {/* Empty Illustration & Copy */}
        <div className="my-auto space-y-4 max-w-xs mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-[#FDFBF7] border border-[#EAE6DE] flex items-center justify-center text-3xl mx-auto shadow-xs">
            🎁
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#24201D]">
              Nothing here yet
            </h2>
            <p className="text-xs text-[#756963] mt-1.5 leading-relaxed">
              Pick a little something from {partnerName}&apos;s rewards.
            </p>
          </div>
          <PillButton
            variant="secondary"
            size="md"
            className="bg-white border-[#EAE6DE] shadow-xs text-xs font-semibold mt-2"
            onClick={() => router.push("/rewards")}
          >
            Browse {partnerName}&apos;s Rewards
          </PillButton>
        </div>

        <div className="pb-4" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-5 pb-32 space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => router.push("/rewards")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#756963] hover:text-[#24201D] py-1 px-2.5 rounded-xl hover:bg-[#F5F2EB] transition-colors"
        >
          <ArrowLeftIcon size={14} />
          <span>Rewards</span>
        </button>

        <span className="text-[11px] font-bold text-[#756963] uppercase tracking-wider">
          Review Your Wish
        </span>
      </div>

      {/* Title Section */}
      <div className="px-1 space-y-1">
        <h1 className="font-serif text-3xl font-bold text-[#24201D] tracking-tight">
          Your Wish
        </h1>
        <p className="text-xs text-[#756963]">
          From <span className="font-semibold text-[#24201D]">{partnerName}</span> ❤️
        </p>
      </div>

      {/* Selected Items List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#807770]">
            Selected Rewards ({totalCount})
          </span>
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] font-semibold text-[#756963] hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.rewardId}
              className="p-3.5 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between gap-3 transition-all hover:border-[#E06D75]/30"
            >
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#FCEBEE] border border-[#FAD4DA] flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#24201D] truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#756963] mt-0.5">
                    <span className="font-semibold text-[#E06D75]">{item.cost} pts</span>
                    {item.quantity > 1 && (
                      <>
                        <span>×</span>
                        <span>{item.quantity}</span>
                        <span className="text-[#807770]">
                          ({item.cost * item.quantity} pts total)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Small Quantity & Remove Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center rounded-xl bg-[#FAF7F2] border border-[#EAE6DE] p-0.5">
                  <button
                    type="button"
                    onClick={() => decrementItem(item.rewardId)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-[#756963] hover:bg-white hover:text-[#24201D] transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-[#24201D]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: item.rewardId,
                        title: item.title,
                        cost: item.cost,
                        icon: item.icon,
                      })
                    }
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-[#756963] hover:bg-white hover:text-[#24201D] transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.rewardId)}
                  className="p-1.5 rounded-lg text-[#A89F99] hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${item.title}`}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Note Box */}
      <div className="space-y-1.5 px-0.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="wish-note"
            className="text-[11px] font-bold uppercase tracking-wider text-[#807770]"
          >
            Add a little note
          </label>
          <span className="text-[10px] text-[#A89F99]">
            {note.length}/{maxNoteLength}
          </span>
        </div>
        <div className="relative">
          <textarea
            id="wish-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, maxNoteLength))}
            rows={2}
            placeholder="Tell them why you'd love this…"
            className="w-full rounded-2xl bg-white border border-[#EAE6DE] p-3 text-xs text-[#24201D] placeholder:text-[#A89F99] placeholder:italic focus:outline-none focus:border-[#E06D75] focus:ring-1 focus:ring-[#E06D75] resize-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Points Summary Card */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE6DE] shadow-xs space-y-3">
        <div className="space-y-2 text-xs divide-y divide-[#FAF7F2]">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-[#756963]">Your points</span>
            <span className="font-bold text-[#24201D]">{availablePoints} available</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[#756963]">This wish</span>
            <span className="font-bold text-[#E06D75]">{totalCost} pts</span>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="font-semibold text-[#24201D]">After</span>
            <span className="font-bold text-[#557567]">{pointsRemaining} pts</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#F5F2EB] text-[11px] text-[#756963] leading-relaxed">
          Your <span className="font-semibold text-[#24201D]">{totalCost} pts</span> will be reserved until{" "}
          <span className="font-semibold text-[#24201D]">{partnerName}</span> responds.
        </div>
      </div>

      {/* Insufficient Points Warning (if needed) */}
      {!hasEnoughPoints && (
        <div className="p-3.5 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] text-xs space-y-1 animate-in fade-in duration-200">
          <div className="font-bold text-[#8E5E1E]">
            Not enough points
          </div>
          <p className="text-[#756963] leading-relaxed">
            You have <span className="font-semibold text-[#24201D]">{availablePoints} pts</span>,
            but this wish needs <span className="font-semibold text-[#E06D75]">{totalCost} pts</span>.
            Complete some tasks first or remove an item.
          </p>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#EAE6DE]">
        <div className="max-w-md mx-auto space-y-1.5">
          <PillButton
            variant="primary"
            size="lg"
            disabled={!hasEnoughPoints || items.length === 0 || submitting}
            loading={submitting}
            onClick={handleSendWish}
            className="w-full font-semibold shadow-[0_4px_16px_rgba(224,109,117,0.3)]"
          >
            {submitting ? "Sending your wish…" : `Send Wish to ${partnerName} ❤️`}
          </PillButton>

          <p className="text-[11px] text-center text-[#807770]">
            Your points are reserved until they respond.
          </p>
        </div>
      </div>

      <Toast
        title={toastMessage || ""}
        isOpen={Boolean(toastMessage)}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
