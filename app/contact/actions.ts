"use server";

import { headers } from "next/headers";
import { createClient, findDuplicateClients } from "@/lib/clients";
import { validateClientInquiry, getClientIp, formRateLimit } from "@/lib/security";
import { logActivity } from "@/lib/logging";
import { queueEmail } from "@/lib/email";
import { inquiryNotificationEmail } from "@/lib/email/templates";

export async function submitInquiryAction(formData: FormData) {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const rateLimitResult = formRateLimit(ip);
  if (!rateLimitResult.success) {
    return { error: "Too many submissions. Please try again later." };
  }

  const data = {
    fullName: String(formData.get("fullName") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    howFound: String(formData.get("howFound") || ""),
    destination: String(formData.get("destination") || ""),
    tripDurationDays: formData.get("tripDurationDays") ? Number(formData.get("tripDurationDays")) : undefined,
    departureMonthYear: String(formData.get("departureMonthYear") || ""),
    returnMonthYear: String(formData.get("returnMonthYear") || ""),
    bestTimeToContact: String(formData.get("bestTimeToContact") || ""),
    consentToContact: formData.get("consentToContact") === "on",
    customStatement: String(formData.get("customStatement") || ""),
  };

  const validation = validateClientInquiry(data);

  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return { error: firstError?.message || "Please provide at least your name and one contact method" };
  }

  const duplicates = await findDuplicateClients(
    data.email || undefined,
    data.phone || undefined
  );

  const client = await createClient({
    ...data,
    consentGivenAt: new Date().toISOString(),
    consentIp: ip,
    consentVersion: "privacy-policy-v1",
  });

  if (!client || client.length === 0) {
    return { error: "Failed to submit inquiry. Please try again." };
  }

  try {
    const adminEmail = process.env.EMAIL_ADMIN_TO || "myah@example.com";
    const notification = inquiryNotificationEmail(
      data.fullName,
      data.destination || null,
      data.email || null,
      data.phone || null
    );

    await queueEmail({
      toEmail: adminEmail,
      subject: notification.subject,
      body: notification.html,
    });
  } catch (error) {
    console.error("Failed to queue inquiry notification:", error);
  }

  try {
    await logActivity({
      userId: null,
      actionType: "create",
      entityType: "client",
      entityId: client[0].id,
      details: `New inquiry from ${data.fullName}${duplicates.length > 0 ? " (possible duplicate)" : ""}`,
      ipAddress: ip,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }

  return { success: true, clientId: client[0].id, isDuplicate: duplicates.length > 0 };
}
