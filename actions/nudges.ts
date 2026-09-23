"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";
import { sendPushNotification } from "@/lib/push";

export type NudgeType = "HEARTBEAT" | "KISS" | "HUG" | "MISS_YOU" | "WHISPER";

export interface NudgeItem {
  id: string;
  type: NudgeType;
  message: string | null;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  receiverId: string;
  isFromMe: boolean;
  seenAt: string | null;
  createdAt: string;
}

function getNudgeContent(type: NudgeType, senderName: string, customMessage?: string) {
  switch (type) {
    case "HEARTBEAT":
      return {
        emoji: "💓",
        title: `💓 Heartbeat from ${senderName}`,
        body: `${senderName} sent you a gentle heartbeat pulse.`,
      };
    case "KISS":
      return {
        emoji: "💋",
        title: `💋 Kiss from ${senderName}`,
        body: `${senderName} sent you a sweet kiss.`,
      };
    case "HUG":
      return {
        emoji: "🤗",
        title: `🤗 Warm Hug from ${senderName}`,
        body: `${senderName} sent you a warm, cozy embrace.`,
      };
    case "MISS_YOU":
      return {
        emoji: "☕",
        title: `Thinking of you ✨`,
        body: `${senderName} is thinking of you right now.`,
      };
    case "WHISPER":
    default:
      return {
        emoji: "💌",
        title: `💌 Whisper from ${senderName}`,
        body: customMessage?.trim() || `${senderName} sent you a private whisper.`,
      };
  }
}

export async function sendNudge(type: NudgeType, message?: string) {
  try {
    const { user, couple, partner } = await requireCouple();

    if (!partner) {
      return {
        success: false,
        error: "Your partner hasn't joined your couple space yet.",
      };
    }

    const cleanMessage = message?.trim() ? message.trim().slice(0, 140) : null;
    const { title, body } = getNudgeContent(type, user.name, cleanMessage || undefined);

    const nudge = await prisma.$transaction(async (tx) => {
      const created = await tx.nudge.create({
        data: {
          coupleId: couple.id,
          senderId: user.id,
          receiverId: partner.id,
          type,
          message: cleanMessage,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      // Also create an in-app notification entry
      await tx.notification.create({
        data: {
          userId: partner.id,
          type: "NUDGE_RECEIVED",
          title,
          body,
        },
      });

      return created;
    });

    // Send Web Push notification immediately to partner's phone
    sendPushNotification(partner.id, {
      title,
      body,
      url: "/home?sheet=whispers",
      icon: "/icon-192.png",
    }).catch((err) => console.error("[Push] Nudge push failed:", err));

    revalidatePath("/home");
    revalidatePath("/us");

    return {
      success: true,
      nudge: {
        id: nudge.id,
        type: nudge.type as NudgeType,
        message: nudge.message,
        senderId: nudge.senderId,
        senderName: nudge.sender.name,
        senderAvatar: nudge.sender.avatar,
        receiverId: nudge.receiverId,
        isFromMe: true,
        seenAt: nudge.seenAt ? nudge.seenAt.toISOString() : null,
        createdAt: nudge.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send nudge";
    return { success: false, error: msg };
  }
}

export async function getNudges(): Promise<{
  success: boolean;
  data?: NudgeItem[];
  error?: string;
}> {
  try {
    const { user, couple } = await requireCouple();

    const nudges = await prisma.nudge.findMany({
      where: { coupleId: couple.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return {
      success: true,
      data: nudges.map((n) => ({
        id: n.id,
        type: n.type as NudgeType,
        message: n.message,
        senderId: n.senderId,
        senderName: n.sender.name,
        senderAvatar: n.sender.avatar,
        receiverId: n.receiverId,
        isFromMe: n.senderId === user.id,
        seenAt: n.seenAt ? n.seenAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load whispers";
    return { success: false, error: msg };
  }
}

export async function markNudgesAsSeen() {
  try {
    const { user, couple } = await requireCouple();

    await prisma.nudge.updateMany({
      where: {
        coupleId: couple.id,
        receiverId: user.id,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to mark as seen";
    return { success: false, error: msg };
  }
}

export async function checkUnseenNudge(): Promise<{
  success: boolean;
  nudge?: NudgeItem | null;
}> {
  try {
    const { user, couple } = await requireCouple();

    const latest = await prisma.nudge.findFirst({
      where: {
        coupleId: couple.id,
        receiverId: user.id,
        seenAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!latest) {
      return { success: true, nudge: null };
    }

    return {
      success: true,
      nudge: {
        id: latest.id,
        type: latest.type as NudgeType,
        message: latest.message,
        senderId: latest.senderId,
        senderName: latest.sender.name,
        senderAvatar: latest.sender.avatar,
        receiverId: latest.receiverId,
        isFromMe: false,
        seenAt: null,
        createdAt: latest.createdAt.toISOString(),
      },
    };
  } catch {
    return { success: false, nudge: null };
  }
}
