import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  pointBalance: number;
  batteryLevel?: number | null;
  isCharging?: boolean | null;
  batteryUpdatedAt?: string | null;
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
 * Validates authenticated session and loads user with their couple space in ONE single DB query.
 * Cached per request with React.cache() so multiple actions or components in the same render
 * make zero duplicate queries.
 */
export const requireAuth = cache(async (): Promise<AuthenticatedUser> => {
  const reqHeaders = await headers();

  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          pointBalance: true,
        },
      });

      if (dbUser) {
        return dbUser;
      }
    }
  } catch {
    // Session validation error
  }

  throw new Error("UNAUTHORIZED: Session is required to perform this action.");
});

/**
 * Validates that user belongs to an active couple space in a single optimized DB query.
 * Cached per request with React.cache().
 */
export const requireCouple = cache(async (): Promise<AuthenticatedContext> => {
  const reqHeaders = await headers();

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED: Session is required to perform this action.");
  }

  // Combined Single Join: Fetch user + couple membership + partner in 1 query
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      pointBalance: true,
      batteryLevel: true,
      isCharging: true,
      batteryUpdatedAt: true,
      coupleMember: {
        include: {
          couple: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                      pointBalance: true,
                      batteryLevel: true,
                      isCharging: true,
                      batteryUpdatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    throw new Error("UNAUTHORIZED: User not found.");
  }

  const membership = dbUser.coupleMember;
  if (!membership || !membership.couple) {
    throw new Error("NO_COUPLE: You are not part of an active couple space yet.");
  }

  const couple = membership.couple;
  const partnerMember = couple.members.find((m) => m.userId !== dbUser.id);
  const partner = partnerMember?.user ?? null;

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      pointBalance: dbUser.pointBalance,
      batteryLevel: dbUser.batteryLevel,
      isCharging: dbUser.isCharging,
      batteryUpdatedAt: dbUser.batteryUpdatedAt ? dbUser.batteryUpdatedAt.toISOString() : null,
    },
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
    partner: partner
      ? {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar,
          pointBalance: partner.pointBalance,
          batteryLevel: partner.batteryLevel,
          isCharging: partner.isCharging,
          batteryUpdatedAt: partner.batteryUpdatedAt ? partner.batteryUpdatedAt.toISOString() : null,
        }
      : null,
  };
});

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
