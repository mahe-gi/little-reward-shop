import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayoutClient } from "@/components/shell/AppLayoutClient";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  let destination: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      destination = "/login";
    } else if (session?.user?.id) {
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
      }
    }
  } catch (error) {
    console.error("AppLayout auth verification error:", error);
    destination = "/login";
  }

  if (destination) {
    redirect(destination);
  }

  return <AppLayoutClient>{children}</AppLayoutClient>;
}
