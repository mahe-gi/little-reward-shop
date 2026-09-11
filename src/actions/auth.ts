"use server";

import {
  setSession,
  clearSession,
  getSession,
  validateProductionAuthConfig,
} from "@/lib/auth";
import { UserRole } from "@/types";
import { resetLocalDb } from "@/db";

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
      ? process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "mahesh123" : "")
      : process.env.GIRLFRIEND_PASSWORD || (process.env.NODE_ENV !== "production" ? "love123" : "");

  if (!expectedPassword) {
    return {
      success: false,
      error: "Server configuration error: password is not configured.",
    };
  }

  if (password !== expectedPassword) {
    return { success: false, error: "Incorrect password. Try again! ❤️" };
  }

  const userId = role === "admin" ? "user_mahesh" : "user_girlfriend";
  const name = role === "admin" ? "Mahesh" : "Her";

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

export async function devSwitchRoleAction(role: UserRole) {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Disabled in production" };
  }
  const userId = role === "admin" ? "user_mahesh" : "user_girlfriend";
  const name = role === "admin" ? "Mahesh" : "Her";
  await setSession({ userId, name, role });
  return { success: true, role };
}

export async function resetDevDataAction() {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Disabled in production" };
  }
  resetLocalDb();
  return { success: true };
}
