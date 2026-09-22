"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple, verifyTaskAssignee } from "@/lib/permissions";
import { earnPoints } from "@/lib/points";
import { recordTaskStreakDay } from "@/lib/streaks";

export async function getTasks() {
  try {
    const { user, couple, partner } = await requireCouple();

    const allTasks = await prisma.task.findMany({
      where: {
        coupleId: couple.id,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const myTasks = allTasks.filter((t: { assignedToId: string | null }) => t.assignedToId === user.id);
    const givenTasks = partner
      ? allTasks.filter((t: { assignedToId: string | null }) => t.assignedToId === partner.id)
      : [];

    return {
      success: true,
      data: {
        myTasks,
        givenTasks,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load tasks";
    return { success: false, error: msg };
  }
}

export async function completeTask(taskId: string) {
  try {
    const { user, couple } = await requireCouple();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.coupleId !== couple.id) {
      return { success: false, error: "Unauthorized access to task" };
    }

    verifyTaskAssignee(task, user.id);

    if (task.status === "COMPLETED") {
      return { success: false, error: "Task is already completed today!" };
    }

    // Atomic transaction: mark completed, earn points, update streak, log activity
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Mark task completed
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // 2. Award points & log wallet transaction
      const updated = await earnPoints(
        tx,
        user.id,
        task.points,
        `Completed habit: ${task.title}`,
        taskId
      );

      // 3. Record streak day
      await recordTaskStreakDay(tx, couple.id, user.id, couple.timezone);

      // 4. Record Activity
      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "TASK_COMPLETED",
          description: `completed "${task.title}" (+${task.points} pts)`,
          referenceId: taskId,
        },
      });

      return updated;
    });

    revalidatePath("/");
    revalidatePath("/tasks");
    return {
      success: true,
      pointsEarned: task.points,
      newBalance: updatedUser.pointBalance,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to complete task";
    return { success: false, error: msg };
  }
}

export async function giveTask(
  title: string,
  points: number,
  description?: string,
  frequency: "DAILY" | "ONETIME" = "DAILY"
) {
  try {
    const { user, couple, partner } = await requireCouple();

    if (!partner) {
      return {
        success: false,
        error: "Your partner has not joined the couple space yet.",
      };
    }

    if (!title || !title.trim()) {
      return { success: false, error: "Please enter a task title." };
    }

    const validPoints = Math.max(1, Math.min(points, 100));

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          coupleId: couple.id,
          createdById: user.id,
          assignedToId: partner.id,
          title: title.trim(),
          description: description?.trim() || null,
          points: validPoints,
          frequency,
          icon: "✨",
        },
      });

      await tx.activity.create({
        data: {
          coupleId: couple.id,
          actorUserId: user.id,
          type: "TASK_CREATED",
          description: `gave task "${title.trim()}" (+${validPoints} pts) to ${partner.name}`,
          referenceId: created.id,
        },
      });

      return created;
    });

    revalidatePath("/tasks");
    return { success: true, task };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to give task";
    return { success: false, error: msg };
  }
}
