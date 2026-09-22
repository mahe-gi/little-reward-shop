import { redirect } from "next/navigation";
import { getCoupleState } from "@/actions/couple";
import { getTasks } from "@/actions/tasks";
import { TasksClient } from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [coupleRes, tasksRes] = await Promise.all([
    getCoupleState(),
    getTasks(),
  ]);

  if (!coupleRes.success || !coupleRes.data) {
    redirect("/onboarding/couple");
  }

  const partnerName = coupleRes.data.partner?.name || "Partner";
  const myTasks = tasksRes.success && tasksRes.data ? tasksRes.data.myTasks : [];
  const givenTasks = tasksRes.success && tasksRes.data ? tasksRes.data.givenTasks : [];

  return (
    <TasksClient
      partnerName={partnerName}
      initialMyTasks={myTasks as any}
      initialGivenTasks={givenTasks as any}
    />
  );
}
