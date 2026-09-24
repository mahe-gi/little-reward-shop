"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";
import { sendPushNotification } from "@/lib/push";

export interface VoiceWhisperItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  audioData: string;
  durationSec: number;
  isListened: boolean;
  createdAt: string;
}

export async function sendVoiceWhisper(
  audioData: string,
  durationSec: number
): Promise<{ success: boolean; whisperId?: string; error?: string }> {
  try {
    const { user, couple, partner } = await requireCouple();

    if (!partner) {
      return { success: false, error: "No partner linked yet" };
    }

    if (!audioData || !audioData.startsWith("data:audio/")) {
      return { success: false, error: "Invalid audio format" };
    }

    // Safety limit on size (~2.5MB max to prevent DB bloat)
    if (audioData.length > 2_500_000) {
      return { success: false, error: "Audio message is too large (max 30s)" };
    }

    const clampedDuration = Math.max(1, Math.min(30, Math.round(durationSec || 1)));

    const whisper = await prisma.voiceWhisper.create({
      data: {
        coupleId: couple.id,
        senderId: user.id,
        receiverId: partner.id,
        audioData,
        durationSec: clampedDuration,
      },
    });

    // Create in-app notification for partner
    await prisma.notification.create({
      data: {
        userId: partner.id,
        type: "VOICE_WHISPER",
        title: "📻 Voice Whisper",
        body: `${user.name} sent you a voice whisper (${clampedDuration}s)!`,
      },
    });

    // Send web push notification (non-blocking)
    sendPushNotification(partner.id, {
      title: "📻 Voice Whisper",
      body: `${user.name} sent you a voice whisper (${clampedDuration}s)!`,
      url: "/home",
    }).catch(() => {});

    revalidatePath("/home");

    return { success: true, whisperId: whisper.id };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send whisper";
    return { success: false, error: msg };
  }
}

export async function getLatestVoiceWhisper(): Promise<{
  success: boolean;
  whisper: VoiceWhisperItem | null;
  unreadCount: number;
  error?: string;
}> {
  try {
    const { user, couple } = await requireCouple();

    const [unreadCount, unlistened, latest] = await Promise.all([
      prisma.voiceWhisper.count({
        where: { coupleId: couple.id, receiverId: user.id, isListened: false },
      }),
      prisma.voiceWhisper.findFirst({
        where: { coupleId: couple.id, receiverId: user.id, isListened: false },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.voiceWhisper.findFirst({
        where: { coupleId: couple.id, receiverId: user.id },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
    ]);

    const activeWhisper = unlistened || latest;

    if (!activeWhisper) {
      return { success: true, whisper: null, unreadCount: 0 };
    }

    return {
      success: true,
      unreadCount,
      whisper: {
        id: activeWhisper.id,
        senderId: activeWhisper.sender.id,
        senderName: activeWhisper.sender.name,
        senderAvatar: activeWhisper.sender.avatar,
        audioData: activeWhisper.audioData,
        durationSec: activeWhisper.durationSec,
        isListened: activeWhisper.isListened,
        createdAt: activeWhisper.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load voice whisper";
    return { success: false, whisper: null, unreadCount: 0, error: msg };
  }
}

export async function markWhisperListened(
  whisperId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireCouple();

    await prisma.voiceWhisper.updateMany({
      where: { id: whisperId, receiverId: user.id },
      data: { isListened: true, listenedAt: new Date() },
    });

    revalidatePath("/home");

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to mark whisper listened";
    return { success: false, error: msg };
  }
}
