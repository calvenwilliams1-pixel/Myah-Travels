"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isGuideOwner } from "@/lib/guide";
import { setSetting } from "@/lib/settings";

/**
 * Dismissal for the dashboard release notes (R2 onward). One note at
 * a time, one sentence each, and a "Got it" that puts it away for
 * good. Notes are written for the site owner, so only her account
 * can dismiss them; the ids are a fixed list so nothing else can be
 * written through this action.
 */
const NOTE_IDS = ["r2", "r3", "r4"] as const;

export async function dismissDashboardNote(noteId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!isGuideOwner(user?.username)) return;
  if (!(NOTE_IDS as readonly string[]).includes(noteId)) return;
  await setSetting(`dashboard_note_dismissed_${noteId}`, "1");
  revalidatePath("/admin");
}
