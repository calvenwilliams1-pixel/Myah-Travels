"use server";

import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface AttemptRecord {
  count: number;
  lockedUntil?: number;
}

function getAttempts(): AttemptRecord {
  const cookieStore = cookies();
  const raw = cookieStore.get("pw_change_attempts")?.value;
  if (!raw) return { count: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { count: 0 };
  }
}

function setAttempts(record: AttemptRecord) {
  const cookieStore = cookies();
  cookieStore.set("pw_change_attempts", JSON.stringify(record), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * LOCKOUT_MINUTES,
  });
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const attempts = getAttempts();

  // Check if locked out
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return { error: `Too many attempts. Try again in ${remainingMinutes} minutes.` };
  }

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const userId = parseInt(user.id);
  const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (currentUser.length === 0) {
    return { error: "User not found" };
  }

  const isValid = await verifyPassword(currentPassword, currentUser[0].passwordHash);

  if (!isValid) {
    const newCount = attempts.count + 1;
    if (newCount >= MAX_ATTEMPTS) {
      setAttempts({
        count: 0,
        lockedUntil: Date.now() + LOCKOUT_MINUTES * 60000,
      });
      return { error: `Too many failed attempts. Locked for ${LOCKOUT_MINUTES} minutes.` };
    }
    setAttempts({ count: newCount });
    return { error: `Current password is incorrect. ${MAX_ATTEMPTS - newCount} attempts remaining.` };
  }

  // Reset attempts on success
  setAttempts({ count: 0 });

  const newHash = await hashPassword(newPassword);

  await db.update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  return { success: true };
}
