"use server";

import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { setMultipleSettings } from "@/lib/settings";
import { getPalette } from "@/lib/theme/palettes";
import { logActivity } from "@/lib/logging";

async function requireSetupUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.hasCompletedSetup) throw new Error("Setup already completed");
  return user;
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireSetupUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash, mustChangePassword: false }).where(eq(users.id, user.id));

  await logActivity({
    userId: user.id,
    actionType: "password_changed",
    entityType: "user",
    entityId: user.id,
    details: "Password changed via setup wizard",
  });

  return { success: true };
}

export async function changeUsernameAction(formData: FormData) {
  const user = await requireSetupUser();
  const newUsername = String(formData.get("username") || "").trim();

  if (!newUsername) {
    return { success: true, kept: true };
  }
  if (newUsername.length < 3 || newUsername.length > 50) {
    return { error: "Username must be 3-50 characters." };
  }
  if (newUsername === user.username) {
    return { success: true, kept: true };
  }

  const existing = await db.select().from(users).where(eq(users.username, newUsername)).limit(1);
  if (existing.length > 0) {
    return { error: "That username is already taken." };
  }

  await db.update(users).set({ username: newUsername }).where(eq(users.id, user.id));

  await logActivity({
    userId: user.id,
    actionType: "username_changed",
    entityType: "user",
    entityId: user.id,
    details: `Username changed to ${newUsername}`,
  });

  return { success: true, username: newUsername };
}

export async function applyThemeAction(formData: FormData) {
  const user = await requireSetupUser();
  const paletteName = String(formData.get("palette") || "");

  const palette = getPalette(paletteName);
  if (!palette) {
    return { error: "Unknown palette." };
  }

  await setMultipleSettings({
    primary_color: palette.primary,
    accent_color: palette.accent,
  });

  await db.update(users).set({ hasCompletedSetup: true }).where(eq(users.id, user.id));

  await logActivity({
    userId: user.id,
    actionType: "setup_completed",
    entityType: "user",
    entityId: user.id,
    details: `Setup completed with palette: ${paletteName}`,
  });

  return { success: true };
}
