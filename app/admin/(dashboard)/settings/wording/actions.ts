"use server";

import { db } from "@/lib/db";
import { settings } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { setSetting, getSetting } from "@/lib/settings";
import { logActivity } from "@/lib/logging";
import { queueEmail } from "@/lib/email";
import { magicLinkEmail } from "@/lib/email/templates";
import {
  WORDING_BY_KEY,
  WORDING_REGISTRY,
  resolveInviteCopy,
  validateWordingValue,
  formatExpiryLabel,
} from "@/lib/wording/registry";
import { loadEmailIdentity } from "@/lib/wording";

/**
 * Save one wording field. An empty save deletes the override, so the
 * standard words come back — a field can never be saved blank.
 * Validation errors come back in plain words and nothing is stored.
 */
export async function saveWordingField(
  key: string,
  value: string
): Promise<{ ok: true } | { error: string }> {
  const user = await requireAuth();
  const entry = WORDING_BY_KEY[key];
  if (!entry) return { error: "That field is not on this page." };

  if (value.trim() === "") {
    await db.delete(settings).where(eq(settings.key, entry.settingsKey));
    await logActivity({
      userId: user.id,
      actionType: "update",
      entityType: "setting",
      entityId: 0,
      details: `Wording reset to standard: ${entry.key}`,
    });
    return { ok: true };
  }

  const error = validateWordingValue(entry, value);
  if (error) return { error };

  await setSetting(entry.settingsKey, value);
  await logActivity({
    userId: user.id,
    actionType: "update",
    entityType: "setting",
    entityId: 0,
    details: `Wording edited: ${entry.key}`,
  });
  return { ok: true };
}

/** Reset one field to the standard words (deletes the override). */
export async function resetWordingField(
  key: string
): Promise<{ ok: true } | { error: string }> {
  return saveWordingField(key, "");
}

/**
 * Render the invite email with sample details, using the words
 * currently in the form (saved or not). This is the same render
 * function the real send uses, so what she sees is what a client
 * gets. The sample link grants nothing: it opens the expired-link
 * page, on purpose.
 */
async function renderSampleInvite(values: Record<string, string>) {
  const overrides: Record<string, string> = {};
  for (const entry of WORDING_REGISTRY) {
    if (entry.group !== "invite") continue;
    const v = values[entry.key];
    if (v !== undefined) overrides[entry.settingsKey] = v;
  }
  const copy = resolveInviteCopy(overrides);
  const identity = await loadEmailIdentity();
  const sampleDate = new Date();
  sampleDate.setDate(sampleDate.getDate() + 30);
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  return magicLinkEmail(
    "Alex",
    "Sample Trip",
    `${siteUrl}/portal/access/sample-link`,
    formatExpiryLabel(sampleDate),
    identity.primaryColor,
    {
      copy,
      siteName: identity.siteName,
      instagramUrl: identity.instagramUrl,
      youtubeUrl: identity.youtubeUrl,
    }
  );
}

export async function previewInviteEmail(values: Record<string, string>) {
  await requireAuth();
  return renderSampleInvite(values);
}

export async function sendTestInviteEmail(
  values: Record<string, string>
): Promise<{ ok: true; to: string } | { error: string }> {
  await requireAuth();
  const to =
    (await getSetting("admin_email")) || process.env.EMAIL_ADMIN_TO || "";
  if (!to) {
    return { error: "There is no admin email address on file to send the test to." };
  }
  const email = await renderSampleInvite(values);
  const id = await queueEmail({ toEmail: to, subject: email.subject, body: email.html });
  if (id === null) {
    return { error: "The test email could not be queued. It may be on the suppression list." };
  }
  return { ok: true, to };
}
