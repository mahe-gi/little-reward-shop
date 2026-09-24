import { redirect } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { calculateAvailablePoints } from "@/actions/wallet";
import { getRewards } from "@/actions/rewards";
import { getRequests } from "@/actions/requests";
import { RewardsClient } from "./RewardsClient";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [coupleRes, pointsRes, rewardsRes, requestsRes] = await Promise.all([
    getCoupleState(),
    calculateAvailablePoints(),
    getRewards("ALL"),
    getRequests(),
  ]);

  if (!coupleRes.success || !coupleRes.data) {
    redirect("/onboarding/couple");
  }

  const partnerName = coupleRes.data.partner?.name || "Partner";
  const availablePoints = pointsRes.success && pointsRes.data ? pointsRes.data.availablePoints : 0;
  const partnerRewards = rewardsRes.success && rewardsRes.data ? (rewardsRes.data.partnerRewards as any) : [];
  const myOfferedRewards = rewardsRes.success && rewardsRes.data ? (rewardsRes.data.myOfferedRewards as any) : [];
  const receivedRequests = requestsRes.success && requestsRes.data ? (requestsRes.data.receivedRequests as any) : [];
  const sentRequests = requestsRes.success && requestsRes.data ? (requestsRes.data.sentRequests as any) : [];

  return (
    <RewardsClient
      partnerName={partnerName}
      initialAvailablePoints={availablePoints}
      initialPartnerRewards={partnerRewards}
      initialMyOfferedRewards={myOfferedRewards}
      initialReceivedRequests={receivedRequests}
      initialSentRequests={sentRequests}
    />
  );
}
