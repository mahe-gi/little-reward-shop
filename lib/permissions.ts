import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  pointBalance: number;
}

export interface AuthenticatedContext {
  user: AuthenticatedUser;
  couple: {
    id: string;
    name: string;
    inviteCode: string;
    timezone: string;
    streakCount: number;
  };
  membership: {
    id: string;
    role: string;
    coupleId: string;
    userId: string;
  };
  partner: AuthenticatedUser | null;
}

/**
 * Validates authenticated session against database.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const reqHeaders = await headers();

  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (dbUser) {
        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar,
          pointBalance: dbUser.pointBalance,
        };
      }
    }
  } catch {
    // Session validation error
  }

  throw new Error("UNAUTHORIZED: Session is required to perform this action.");
}

/**
 * Validates that user belongs to an active couple space.
 */
export async function requireCouple(): Promise<AuthenticatedContext> {
  const user = await requireAuth();

  const membership = await prisma.coupleMember.findUnique({
    where: { userId: user.id },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!membership || !membership.couple) {
    throw new Error("NO_COUPLE: You are not part of an active couple space yet.");
  }

  const couple = membership.couple;
  const partnerMember = couple.members.find((m: { userId: string }) => m.userId !== user.id);
  const partner = partnerMember?.user
    ? {
        id: partnerMember.user.id,
        name: partnerMember.user.name,
        email: partnerMember.user.email,
        avatar: partnerMember.user.avatar,
        pointBalance: partnerMember.user.pointBalance,
      }
    : null;

  return {
    user,
    couple: {
      id: couple.id,
      name: couple.name || "Our Space",
      inviteCode: couple.inviteCode,
      timezone: couple.timezone,
      streakCount: couple.streakCount,
    },
    membership: {
      id: membership.id,
      role: membership.role,
      coupleId: membership.coupleId,
      userId: membership.userId,
    },
    partner,
  };
}

/**
 * Validates that the task is assigned to the current user.
 */
export function verifyTaskAssignee(
  task: { assignedToId: string | null },
  userId: string
) {
  if (task.assignedToId !== userId) {
    throw new Error("FORBIDDEN: You cannot complete a task assigned to your partner.");
  }
}

/**
 * Validates that the request recipient is the current user (user cannot approve own request!).
 */
export function verifyRequestRecipient(
  request: { targetPartnerId: string | null },
  userId: string
) {
  if (request.targetPartnerId !== userId) {
    throw new Error("FORBIDDEN: You can only approve or fulfill requests sent to you.");
  }
}

/**
 * Validates that the request creator is the current user (for cancellation).
 */
export function verifyRequestOwner(
  request: { userId: string },
  userId: string
) {
  if (request.userId !== userId) {
    throw new Error("FORBIDDEN: You can only cancel requests you created.");
  }
}
