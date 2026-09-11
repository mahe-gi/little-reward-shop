import { cookies } from "next/headers";
import { UserRole } from "@/types";

const SESSION_COOKIE_NAME = "reward_shop_session";

export interface SessionData {
  userId: string;
  name: string;
  role: UserRole;
}

export function validateProductionAuthConfig() {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error(
        "CRITICAL: ADMIN_PASSWORD environment variable is missing in production."
      );
    }
    if (!process.env.GIRLFRIEND_PASSWORD) {
      throw new Error(
        "CRITICAL: GIRLFRIEND_PASSWORD environment variable is missing in production."
      );
    }
  }
}

let mockSessionForTesting: SessionData | null = null;

export function __setMockSessionForTesting(session: SessionData | null) {
  if (process.env.NODE_ENV !== "production") {
    mockSessionForTesting = session;
  }
}

export async function getSession(): Promise<SessionData | null> {
  if (process.env.NODE_ENV !== "production" && mockSessionForTesting) {
    return mockSessionForTesting;
  }
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
    if (parsed && (parsed.role === "admin" || parsed.role === "girlfriend")) {
      return parsed as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSession(session: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(session)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireRole(expectedRole: UserRole): Promise<SessionData> {
  const session = await getSession();
  if (!session || session.role !== expectedRole) {
    throw new Error(`Unauthorized: Requires ${expectedRole} role`);
  }
  return session;
}
