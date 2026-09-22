import { redirect } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { UsClient, UsData } from "./UsClient";

export const dynamic = "force-dynamic";

export default async function UsPage() {
  const coupleRes = await getCoupleState();

  if (!coupleRes.success || !coupleRes.data) {
    redirect("/onboarding/couple");
  }

  return <UsClient initialData={coupleRes.data as UsData} />;
}
