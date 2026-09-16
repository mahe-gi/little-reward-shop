import { prisma } from "@/lib/prisma";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Returns today's calendar date normalized as YYYY-MM-DD in the given timezone.
 */
export function getNormalizedDateInTimezone(
  date: Date = new Date(),
  timezone: string = "UTC"
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Marks a user's StreakDay record as qualified for today when a task is completed.
 */
export async function recordTaskStreakDay(
  tx: PrismaTx,
  coupleId: string,
  userId: string,
  timezone: string = "UTC"
) {
  const todayStr = getNormalizedDateInTimezone(new Date(), timezone);

  // Upsert StreakDay record
  await tx.streakDay.upsert({
    where: {
      coupleId_userId_date: {
        coupleId,
        userId,
        date: todayStr,
      },
    },
    update: {
      qualified: true,
    },
    create: {
      coupleId,
      userId,
      date: todayStr,
      qualified: true,
    },
  });

  // Check if both partners in the couple completed at least 1 task today
  await recalculateCoupleStreak(tx, coupleId, timezone);
}

/**
 * Recalculates couple streak:
 * Both partners must have a qualified StreakDay record for each consecutive day.
 */
export async function recalculateCoupleStreak(
  tx: PrismaTx,
  coupleId: string,
  timezone: string = "UTC"
): Promise<number> {
  const members = await tx.coupleMember.findMany({
    where: { coupleId },
    select: { userId: true },
  });

  if (members.length < 2) {
    return 0;
  }

  const userA = members[0].userId;
  const userB = members[1].userId;

  // Retrieve last 30 days of streak records for this couple
  const streakDays = await tx.streakDay.findMany({
    where: {
      coupleId,
      qualified: true,
    },
    orderBy: { date: "desc" },
  });

  const daysA = new Set(
    streakDays.filter((s) => s.userId === userA).map((s) => s.date)
  );
  const daysB = new Set(
    streakDays.filter((s) => s.userId === userB).map((s) => s.date)
  );

  let streak = 0;
  const now = new Date();

  // Iterate backwards day-by-day
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = getNormalizedDateInTimezone(d, timezone);

    const aDone = daysA.has(dateStr);
    const bDone = daysB.has(dateStr);

    if (aDone && bDone) {
      streak++;
    } else if (i === 0) {
      // If today is not yet completed by both, don't break streak if yesterday was completed
      continue;
    } else {
      break;
    }
  }

  // Update couple streakCount
  await tx.couple.update({
    where: { id: coupleId },
    data: { streakCount: streak },
  });

  return streak;
}
