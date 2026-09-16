import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Pairly database...");

  // 1. Create Couple Space
  const couple = await prisma.couple.upsert({
    where: { inviteCode: "LOVE-4821" },
    update: {},
    create: {
      id: "couple_seed_01",
      name: "Mahesh & Her",
      inviteCode: "LOVE-4821",
      timezone: "UTC",
      streakCount: 7,
    },
  });

  // 2. Create User A (Mahesh) & User B (Her)
  const mahesh = await prisma.user.upsert({
    where: { email: "mahesh@pairly.local" },
    update: {
      pointBalance: 18,
    },
    create: {
      id: "user_mahesh_01",
      name: "Mahesh",
      email: "mahesh@pairly.local",
      avatar: "🧔",
      pointBalance: 18,
      emailVerified: true,
    },
  });

  const her = await prisma.user.upsert({
    where: { email: "her@pairly.local" },
    update: {
      pointBalance: 12,
    },
    create: {
      id: "user_her_01",
      name: "Her",
      email: "her@pairly.local",
      avatar: "👩‍🦰",
      pointBalance: 12,
      emailVerified: true,
    },
  });

  // 3. Connect Couple Members
  await prisma.coupleMember.upsert({
    where: { userId: mahesh.id },
    update: { coupleId: couple.id },
    create: {
      coupleId: couple.id,
      userId: mahesh.id,
      role: "INITIATOR",
    },
  });

  await prisma.coupleMember.upsert({
    where: { userId: her.id },
    update: { coupleId: couple.id },
    create: {
      coupleId: couple.id,
      userId: her.id,
      role: "PARTNER",
    },
  });

  // 4. Rewards Offered by Her (for Mahesh to request)
  const rewardsHer = [
    {
      title: "Head Massage",
      description: "A 15-minute gentle head and neck massage with essential oils. Total phone-free quiet.",
      cost: 4,
      icon: "💆‍♀️",
      category: "LOVE",
    },
    {
      title: "Special Morning Coffee",
      description: "Fresh pour-over or frothy latte prepared and brought to bed with love.",
      cost: 2,
      icon: "☕",
      category: "FOOD",
    },
    {
      title: "Favorite Snack Surprise",
      description: "Your favorite treat fetched and served whenever the late afternoon craving hits.",
      cost: 3,
      icon: "🍫",
      category: "FOOD",
    },
    {
      title: "Gaming Together",
      description: "A dedicated co-op game session (It Takes Two / Overcooked) with zero interruptions.",
      cost: 4,
      icon: "🎮",
      category: "FUN",
    },
    {
      title: "Sunset & Gelato",
      description: "Golden hour walk by the scenic park followed by your favorite scoop.",
      cost: 5,
      icon: "🍦",
      category: "DATES",
    },
    {
      title: "Bike Adventure Lesson",
      description: "Gentle, zero-pressure bike cruising session tailored just for two.",
      cost: 7,
      icon: "🚲",
      category: "FUN",
    },
  ];

  for (const r of rewardsHer) {
    await prisma.reward.create({
      data: {
        coupleId: couple.id,
        offeredById: her.id,
        title: r.title,
        description: r.description,
        cost: r.cost,
        icon: r.icon,
        category: r.category,
        isActive: true,
      },
    });
  }

  // 5. Rewards Offered by Mahesh (for Her to request)
  const rewardsMahesh = [
    {
      title: "One Big Cozy Hug",
      description: "No rush, tight squeeze whenever needed.",
      cost: 1,
      icon: "❤️",
      category: "LOVE",
    },
    {
      title: "You Choose Dinner",
      description: "Her pick, zero complaints, treated with love.",
      cost: 5,
      icon: "🍕",
      category: "FOOD",
    },
    {
      title: "Movie Night Marathon",
      description: "Unlimited popcorn, snug blanket, phone-free cinematic bliss.",
      cost: 5,
      icon: "🎬",
      category: "DATES",
    },
  ];

  for (const r of rewardsMahesh) {
    await prisma.reward.create({
      data: {
        coupleId: couple.id,
        offeredById: mahesh.id,
        title: r.title,
        description: r.description,
        cost: r.cost,
        icon: r.icon,
        category: r.category,
        isActive: true,
      },
    });
  }

  // 6. Tasks
  await prisma.task.createMany({
    data: [
      {
        coupleId: couple.id,
        createdById: her.id,
        assignedToId: mahesh.id,
        title: "Drink 2.5L Water",
        description: "Hydrate for energy ❤️",
        points: 1,
        icon: "💧",
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        coupleId: couple.id,
        createdById: her.id,
        assignedToId: mahesh.id,
        title: "Evening Workout (45m)",
        description: "Keep the rhythm alive!",
        points: 3,
        icon: "👟",
        status: "COMPLETED",
        completedAt: new Date(),
      },
      {
        coupleId: couple.id,
        createdById: her.id,
        assignedToId: mahesh.id,
        title: "Clean Desk Sanctuary",
        description: "Fresh work sanctuary",
        points: 2,
        icon: "✨",
        status: "ASSIGNED",
      },
      {
        coupleId: couple.id,
        createdById: mahesh.id,
        assignedToId: her.id,
        title: "Morning Walk & Sunshine",
        description: "Take a 20 min gentle stroll",
        points: 2,
        icon: "🌿",
        status: "COMPLETED",
        completedAt: new Date(),
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
