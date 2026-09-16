"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function getProfile() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatar: true,
        pointBalance: true,
      },
    });
    return { success: true, user: dbUser };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load profile";
    return { success: false, error: msg };
  }
}

export async function updateProfile(name: string, avatar: string) {
  try {
    const user = await requireAuth();
    const isUrl = Boolean(avatar && (avatar.startsWith("http://") || avatar.startsWith("https://")));

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim() || user.name,
        avatar: avatar || user.avatar,
        ...(isUrl ? { image: avatar } : {}),
      },
    });

    revalidatePath("/");
    revalidatePath("/us");
    revalidatePath("/home");
    return { success: true, user: updated };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    return { success: false, error: msg };
  }
}
