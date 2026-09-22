import { redirect } from "next/navigation";
import { getHomeDashboardData } from "@/actions/home";
import { getTasks } from "@/actions/tasks";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dashRes, taskRes] = await Promise.all([
    getHomeDashboardData(),
    getTasks(),
  ]);

  if (!dashRes.success || !dashRes.data) {
    redirect("/onboarding/couple");
  }

  const tasks = taskRes.success && taskRes.data ? taskRes.data.myTasks : [];

  return <HomeClient initialData={dashRes.data} initialTasks={tasks as any} />;
}
