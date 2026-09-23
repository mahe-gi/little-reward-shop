"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCouple } from "@/lib/permissions";
import { sendPushNotification } from "@/lib/push";
import {
  getQuestionForDate,
  getRandomSparkQuestion,
  getTodayDateString,
} from "@/lib/daily-spark-questions";

export interface SparkAnswerSummary {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  answerText: string | null; // null if blind-locked
  createdAt: string;
}

export interface TodaySparkData {
  question: {
    id: string;
    date: string;
    question: string;
    category: string;
  };
  myAnswer: SparkAnswerSummary | null;
  partnerAnswer: {
    answered: boolean;
    answerText: string | null; // null when locked
    userName: string;
    userAvatar: string | null;
    createdAt: string | null;
  } | null;
  isUnlocked: boolean;
  pointsAwarded: boolean;
  partnerName: string;
}

export async function getTodaySpark(): Promise<{
  success: boolean;
  data?: TodaySparkData;
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();
    const todayDate = getTodayDateString();
    const newCategories = ["Cute & Flirty", "This or That", "Fun & Silly", "Food & Mood", "Little Moments"];

    // 1. Find or create today's question deterministically from the curated questions library
    let question = await prisma.dailyQuestion.findUnique({
      where: { date: todayDate },
    });

    const def = getQuestionForDate(todayDate);
    if (!question) {
      question = await prisma.dailyQuestion.create({
        data: {
          date: todayDate,
          question: def.question,
          category: def.category,
        },
      });
    } else if (!newCategories.includes(question.category)) {
      // Auto-upgrade legacy question to new relationship questions
      question = await prisma.dailyQuestion.update({
        where: { id: question.id },
        data: {
          question: def.question,
          category: def.category,
        },
      });
    }

    // 2. Fetch answers for this couple
    const answers = await prisma.dailyAnswer.findMany({
      where: {
        questionId: question.id,
        coupleId: couple.id,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const myAns = answers.find((a) => a.userId === user.id);
    const partnerAns = partner ? answers.find((a) => a.userId === partner.id) : null;

    // Both partners must have answered for the Blind Reveal to unlock
    const isUnlocked = Boolean(myAns && partnerAns);
    const pointsAwarded = Boolean(myAns?.pointsAwarded && partnerAns?.pointsAwarded);

    const partnerName = partner?.name || "Partner";

    const data: TodaySparkData = {
      question: {
        id: question.id,
        date: question.date,
        question: question.question,
        category: question.category,
      },
      myAnswer: myAns
        ? {
            id: myAns.id,
            userId: myAns.userId,
            userName: myAns.user.name,
            userAvatar: myAns.user.avatar,
            answerText: myAns.answerText,
            createdAt: myAns.createdAt.toISOString(),
          }
        : null,
      partnerAnswer: partner
        ? {
            answered: Boolean(partnerAns),
            // STRICT BLIND REVEAL: Do NOT send partner's answer text until user has answered!
            answerText: isUnlocked && partnerAns ? partnerAns.answerText : null,
            userName: partner.name,
            userAvatar: partner.avatar,
            createdAt: partnerAns ? partnerAns.createdAt.toISOString() : null,
          }
        : null,
      isUnlocked,
      pointsAwarded,
      partnerName,
    };

    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load Daily Spark";
    return { success: false, error: msg };
  }
}

export async function submitSparkAnswer(
  questionId: string,
  answerText: string
): Promise<{
  success: boolean;
  isUnlocked?: boolean;
  pointsEarned?: number;
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();

    const cleanText = answerText?.trim();
    if (!cleanText) {
      return { success: false, error: "Please write an answer before submitting." };
    }
    if (cleanText.length > 500) {
      return { success: false, error: "Answers are limited to 500 characters." };
    }

    if (!partner) {
      return { success: false, error: "You need a partner linked to play Daily Spark." };
    }

    // Check if partner has already answered
    const partnerAns = await prisma.dailyAnswer.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: partner.id,
        },
      },
    });

    const isPartnerAlreadyAnswered = Boolean(partnerAns);

    if (isPartnerAlreadyAnswered) {
      // 2nd partner answered -> UNLOCK! Award +15 points to each partner!
      await prisma.$transaction(async (tx) => {
        // 1. Save user's answer
        await tx.dailyAnswer.upsert({
          where: {
            questionId_userId: {
              questionId,
              userId: user.id,
            },
          },
          create: {
            questionId,
            coupleId: couple.id,
            userId: user.id,
            answerText: cleanText,
            pointsAwarded: true,
          },
          update: {
            answerText: cleanText,
            pointsAwarded: true,
          },
        });

        // 2. Mark partner answer as points awarded
        await tx.dailyAnswer.update({
          where: { id: partnerAns!.id },
          data: { pointsAwarded: true },
        });

        // 3. Award +15 points to both partners
        await tx.user.update({
          where: { id: user.id },
          data: { pointBalance: { increment: 15 } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            amount: 15,
            type: "BONUS",
            status: "FINALIZED",
            description: "Daily Spark completion bonus ✨",
          },
        });

        await tx.user.update({
          where: { id: partner.id },
          data: { pointBalance: { increment: 15 } },
        });
        await tx.walletTransaction.create({
          data: {
            userId: partner.id,
            amount: 15,
            type: "BONUS",
            status: "FINALIZED",
            description: "Daily Spark completion bonus ✨",
          },
        });

        // 4. Activity
        await tx.activity.create({
          data: {
            coupleId: couple.id,
            actorUserId: user.id,
            type: "TASK_COMPLETED",
            description: `unlocked today's Daily Spark with ${partner.name} (+15 pts each) 🎉`,
          },
        });

        // 5. In-app notification for partner
        await tx.notification.create({
          data: {
            userId: partner.id,
            type: "DAILY_SPARK_UNLOCKED",
            title: "Daily Spark Unlocked! 🎉",
            body: `${user.name} answered! Tap to read both answers and see your +15 pts.`,
          },
        });
      });

      // Send Web Push notification to partner's phone
      sendPushNotification(partner.id, {
        title: "Daily Spark Unlocked! 🎉",
        body: `${user.name} answered! Both responses are now revealed (+15 pts).`,
        url: "/home",
        icon: "/icon-192.png",
      }).catch((err) => console.error("[Push] Spark unlock push failed:", err));

      revalidatePath("/home");
      revalidatePath("/us");

      return { success: true, isUnlocked: true, pointsEarned: 15 };
    } else {
      // 1st partner answered -> Save answer, teaser push notification to partner
      await prisma.$transaction(async (tx) => {
        await tx.dailyAnswer.upsert({
          where: {
            questionId_userId: {
              questionId,
              userId: user.id,
            },
          },
          create: {
            questionId,
            coupleId: couple.id,
            userId: user.id,
            answerText: cleanText,
            pointsAwarded: false,
          },
          update: {
            answerText: cleanText,
          },
        });

        await tx.notification.create({
          data: {
            userId: partner.id,
            type: "DAILY_SPARK_ANSWERED",
            title: "Daily Spark ✨",
            body: `${user.name} answered today's question! Answer to reveal their response.`,
          },
        });
      });

      // Send Web Push to partner
      sendPushNotification(partner.id, {
        title: "Daily Spark ✨",
        body: `${user.name} answered today's question! Answer yours to unlock their response.`,
        url: "/home",
        icon: "/icon-192.png",
      }).catch((err) => console.error("[Push] Spark answered push failed:", err));

      revalidatePath("/home");

      return { success: true, isUnlocked: false, pointsEarned: 0 };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit answer";
    return { success: false, error: msg };
  }
}

export interface SparkHistoryItem {
  id: string;
  date: string;
  question: string;
  category: string;
  myAnswer: string;
  partnerAnswer: string;
  partnerName: string;
}

export async function getSparkHistory(): Promise<{
  success: boolean;
  history?: SparkHistoryItem[];
  error?: string;
}> {
  try {
    const { user, couple, partner } = await requireCouple();

    if (!partner) {
      return { success: true, history: [] };
    }

    // Fetch all questions that have answers from both partners in this couple
    const questions = await prisma.dailyQuestion.findMany({
      where: {
        answers: {
          some: { coupleId: couple.id },
        },
      },
      include: {
        answers: {
          where: { coupleId: couple.id },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    const history: SparkHistoryItem[] = [];

    for (const q of questions) {
      const myAns = q.answers.find((a) => a.userId === user.id);
      const partnerAns = q.answers.find((a) => a.userId === partner.id);

      // Only include unlocked questions in history
      if (myAns && partnerAns) {
        history.push({
          id: q.id,
          date: q.date,
          question: q.question,
          category: q.category,
          myAnswer: myAns.answerText,
          partnerAnswer: partnerAns.answerText,
          partnerName: partner.name,
        });
      }
    }

    return { success: true, history };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load history";
    return { success: false, error: msg };
  }
}

export async function shuffleTodayQuestion(): Promise<{
  success: boolean;
  question?: { id: string; question: string; category: string; date: string };
  error?: string;
}> {
  try {
    const { couple } = await requireCouple();
    const todayDate = getTodayDateString();

    const existingQuestion = await prisma.dailyQuestion.findUnique({
      where: { date: todayDate },
      include: {
        answers: {
          where: { coupleId: couple.id, pointsAwarded: true },
        },
      },
    });

    if (existingQuestion && existingQuestion.answers.length >= 2) {
      return {
        success: false,
        error: "Today's question is already completed and unlocked!",
      };
    }

    const newDef = getRandomSparkQuestion(existingQuestion?.question);

    let updatedQuestion;
    if (existingQuestion) {
      await prisma.dailyAnswer.deleteMany({
        where: {
          questionId: existingQuestion.id,
          coupleId: couple.id,
          pointsAwarded: false,
        },
      });

      updatedQuestion = await prisma.dailyQuestion.update({
        where: { id: existingQuestion.id },
        data: {
          question: newDef.question,
          category: newDef.category,
        },
      });
    } else {
      updatedQuestion = await prisma.dailyQuestion.create({
        data: {
          date: todayDate,
          question: newDef.question,
          category: newDef.category,
        },
      });
    }

    revalidatePath("/home");
    return {
      success: true,
      question: {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        category: updatedQuestion.category,
        date: updatedQuestion.date,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to shuffle question";
    return { success: false, error: msg };
  }
}

