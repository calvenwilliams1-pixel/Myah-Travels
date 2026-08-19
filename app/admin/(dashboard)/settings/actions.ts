"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { setMultipleSettings, addCertification, deleteCertification } from "@/lib/settings";
import { logActivity } from "@/lib/logging";

function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function saveSettingsAction(formData: FormData) {
  const user = await requireAuth();

  const settingsData: Record<string, string> = {};
  const keys = [
    "site_name",
    "tagline",
    "primary_color",
    "secondary_color",
    "accent_color",
    "font_family",
    "admin_email",
    "footer_text",
    "logo_path",
  ];

  for (const key of keys) {
    const value = formData.get(key);
    if (value !== null && value !== undefined) {
      settingsData[key] = String(value);
    }
  }

  for (const colorKey of ["primary_color", "secondary_color", "accent_color"]) {
    if (settingsData[colorKey] && !isValidHexColor(settingsData[colorKey])) {
      return { error: `Invalid color format for ${colorKey}. Use #RRGGBB` };
    }
  }

  if (settingsData.admin_email && !isValidEmail(settingsData.admin_email)) {
    return { error: "Invalid email format for admin email" };
  }

  await setMultipleSettings(settingsData);

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "settings",
    details: "Updated site settings",
  });

  redirect("/admin/settings");
}

export async function addCertificationAction(formData: FormData) {
  const user = await requireAuth();

  const title = String(formData.get("title") || "");
  const organization = String(formData.get("organization") || "");
  const yearEarned = String(formData.get("yearEarned") || "");

  if (!title) {
    return;
  }

  if (yearEarned && !/^\d{4}$/.test(yearEarned)) {
    return { error: "Year must be 4 digits (e.g., 2026)" };
  }

  await addCertification({
    title,
    organization: organization || undefined,
    yearEarned: yearEarned || undefined,
  });

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "certification",
    details: `Added certification: ${title}`,
  });

  redirect("/admin/settings");
}

export async function deleteCertificationAction(formData: FormData) {
  const user = await requireAuth();

  const id = Number(formData.get("id"));

  if (!id) return;

  await deleteCertification(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "certification",
    entityId: id,
    details: "Deleted certification",
  });

  redirect("/admin/settings");
}
