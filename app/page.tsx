import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RootPage() {
  const reqHeaders = await headers();
  let destination = "/login";

  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          coupleMember: {
            include: {
              couple: {
                include: { members: true },
              },
            },
          },
        },
      });

      if (!dbUser?.avatar) {
        destination = "/onboarding/profile";
      } else if (!dbUser.coupleMember || dbUser.coupleMember.couple.members.length < 2) {
        destination = "/onboarding/couple";
      } else {
        destination = "/home";
      }
    }
  } catch (error) {
    console.error("RootPage session check error:", error);
  }

  redirect(destination);
}
