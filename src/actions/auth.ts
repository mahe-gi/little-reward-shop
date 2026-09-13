"use server";

import {
  setSession,
  clearSession,
  getSession,
  validateProductionAuthConfig,
} from "@/lib/auth";
import { UserRole } from "@/types";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function loginAction(formData: FormData) {
  const role = formData.get("role") as UserRole;
  const password = formData.get("password") as string;

  if (!role || (role !== "admin" && role !== "girlfriend")) {
    return { success: false, error: "Invalid role selected." };
  }

  // Validate production requirements
  validateProductionAuthConfig();

  const expectedPassword =
    role === "admin"
      ? process.env.ADMIN_PASSWORD
      : process.env.GIRLFRIEND_PASSWORD;

  if (!expectedPassword) {
    return {
      success: false,
      error: "Server configuration error: password is not configured in environment variables.",
    };
  }

  if (password !== expectedPassword) {
    return { success: false, error: "Incorrect password. Try again! ❤️" };
  }

  const db = getDb();
  const dbUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, role));

  const user = dbUsers[0];
  const userId = user?.id || (role === "admin" ? "user_mahesh" : "user_girlfriend");
  const name = user?.name || (role === "admin" ? "Mahesh" : "Her");

  await setSession({ userId, name, role });
  return { success: true, role };
}

export async function logoutAction() {
  await clearSession();
  return { success: true };
}

export async function getSessionAction() {
  const session = await getSession();
  return session;
}
