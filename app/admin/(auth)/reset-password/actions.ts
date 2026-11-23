"use server";

import { headers } from "next/headers";
import { getClientIp, magicLinkRateLimit } from "@/lib/security";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export async function resetPasswordAction(formData: FormData) {
  const token = (formData.get("token") as string | null) ?? "";
  const newPassword = formData.get("new_password") as string | null;
  const confirmPassword = formData.get("confirm_password") as string | null;

  const ip = getClientIp(headers());
  if (!magicLinkRateLimit(ip, token).success) {
    return { error: "Too many attempts. Please request a new reset link." };
  }

  if (!token) {
    return { error: "This reset link is not valid." };
  }
  if (!newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const done = await resetPasswordWithToken(token, newPassword);
  if (!done) {
    return {
      error:
        "This reset link is no longer valid. It may have expired or already been used — request a new one.",
    };
  }
  return { success: true };
}
