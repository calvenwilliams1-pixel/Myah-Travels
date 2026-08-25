"use server";

import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  verifyPassword,
  verifyTotp,
  createSession,
  logActivity,
} from "@/lib/auth";
import { loginRateLimit, getClientIp, validateLogin } from "@/lib/security";

async function getRequestContext() {
  const headersList = await headers();
  return {
    ip: getClientIp(headersList),
    userAgent: headersList.get("user-agent") || "unknown",
  };
}

export async function loginAction(
  formData: FormData
): Promise<{ error?: string; requiresTotp?: boolean; success?: boolean }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const { ip, userAgent } = await getRequestContext();

  const rateLimitResult = loginRateLimit(ip);
  if (!rateLimitResult.success) {
    return {
      error: "Too many login attempts. Please try again later.",
    };
  }

  const validation = validateLogin({ username, password });
  if (!validation.success) {
    return { error: "Invalid username or password." };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0) {
    await logActivity(null, "login_failed", "user", undefined, "User not found", ip, userAgent);
    return { error: "Invalid username or password." };
  }

  const foundUser = user[0];

  const passwordValid = await verifyPassword(password, foundUser.passwordHash);

  if (!passwordValid) {
    await logActivity(
      foundUser.id,
      "login_failed",
      "user",
      foundUser.id,
      "Invalid password",
      ip,
      userAgent
    );
    return { error: "Invalid username or password." };
  }

  if (foundUser.totpEnabled && foundUser.totpSecret) {
    return { requiresTotp: true };
  }

  await createSession(foundUser.id);
  await logActivity(
    foundUser.id,
    "login_success",
    "user",
    foundUser.id,
    "Login successful",
    ip,
    userAgent
  );

  return { success: true };
}

export async function verifyTotpAction(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const username = formData.get("username") as string;
  const totpCode = formData.get("totpCode") as string;

  const { ip, userAgent } = await getRequestContext();

  const rateLimitResult = loginRateLimit(ip);
  if (!rateLimitResult.success) {
    return {
      error: "Too many attempts. Please try again later.",
    };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0 || !user[0].totpSecret) {
    return { error: "Invalid code." };
  }

  const foundUser = user[0];
  const totpValid = verifyTotp(totpCode, foundUser.totpSecret);

  if (!totpValid) {
    await logActivity(
      foundUser.id,
      "totp_failed",
      "user",
      foundUser.id,
      "Invalid TOTP code",
      ip,
      userAgent
    );
    return { error: "Invalid code." };
  }

  await createSession(foundUser.id);
  await logActivity(
    foundUser.id,
    "login_success",
    "user",
    foundUser.id,
    "Login successful with TOTP",
    ip,
    userAgent
  );

  return { success: true };
}