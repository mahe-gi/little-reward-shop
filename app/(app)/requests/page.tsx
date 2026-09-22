import { redirect } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { getRequests } from "@/actions/requests";
import { RequestsClient, RequestEntry } from "./RequestsClient";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const [coupleRes, requestsRes] = await Promise.all([
    getCoupleState(),
    getRequests(),
  ]);

  if (!coupleRes.success || !coupleRes.data) {
    redirect("/onboarding/couple");
  }

  const partnerName = coupleRes.data.partner?.name || "Partner";
  const received = (requestsRes.success && requestsRes.data?.receivedRequests
    ? requestsRes.data.receivedRequests
    : []) as unknown as RequestEntry[];
  const sent = (requestsRes.success && requestsRes.data?.sentRequests
    ? requestsRes.data.sentRequests
    : []) as unknown as RequestEntry[];

  return (
    <RequestsClient
      initialReceived={received}
      initialSent={sent}
      partnerName={partnerName}
    />
  );
}
