"use server";

import { headers } from "next/headers";
import { getClientIp, formRateLimit } from "@/lib/security";
import { requestPasswordReset } from "@/lib/auth/password-reset";

export async function requestPasswordResetAction(formData: FormData) {
  const ip = getClientIp(headers());
  if (!formRateLimit(ip).success) {
    return { error: "Too many requests. Please try again later." };
  }

  const username = (formData.get("username") as string | null)?.trim();
  if (!username) {
    return { error: "Enter your username" };
  }

  // Always reports success — the response must not reveal whether the
  // account exists. The link is emailed only when it does.
  await requestPasswordReset(username);
  return { success: true };
}
