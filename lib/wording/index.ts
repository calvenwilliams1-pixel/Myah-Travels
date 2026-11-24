import { db } from "@/lib/db";
import { settings } from "@/drizzle/schema";
import { inArray } from "drizzle-orm";
import {
  WORDING_REGISTRY,
  resolveAllWording,
  resolveInviteCopy,
  type InviteCopy,
} from "./registry";

export * from "./registry";

/**
 * Read the wording overrides straight from the settings table.
 *
 * This deliberately does not go through lib/settings: that module is
 * wrapped in React's cache(), which breaks outside a server-component
 * request — the email queue worker is one of those places, and the
 * invite email is rendered there (via lib/portal). Same pattern as
 * the brand-colour read in sendMagicLinkToMember.
 */
export async function loadWordingOverrides(): Promise<Record<string, string>> {
  const keys = WORDING_REGISTRY.map((e) => e.settingsKey);
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, keys));
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.value != null) map[row.key] = row.value;
  }
  return map;
}

/** Every wording string, resolved (override or default). */
export async function getWording(): Promise<Record<string, string>> {
  return resolveAllWording(await loadWordingOverrides());
}

/** The invite email's copy, resolved (override or default). */
export async function getInviteCopy(): Promise<InviteCopy> {
  return resolveInviteCopy(await loadWordingOverrides());
}

/**
 * The site identity the emails wear: name and social URLs from
 * Settings, read directly for the same reason as above. Returns nulls
 * for anything unset; callers decide what an empty value means (the
 * invite shell hides a social link whose URL is empty).
 */
export async function loadEmailIdentity(): Promise<{
  siteName: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  primaryColor: string | null;
}> {
  const rows = await db
    .select()
    .from(settings)
    .where(
      inArray(settings.key, ["site_name", "instagram_url", "youtube_url", "primary_color"])
    );
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.value != null) map[row.key] = row.value;
  }
  return {
    siteName: map.site_name ?? null,
    instagramUrl: map.instagram_url ?? null,
    youtubeUrl: map.youtube_url ?? null,
    primaryColor: map.primary_color ?? null,
  };
}
