import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { isGuideOwner } from "@/lib/guide";
import { getSetting } from "@/lib/settings";
import { dismissDashboardNote } from "../note-actions";

/**
 * The one dashboard note for the current release: a single sentence
 * saying what is new, with a "Got it" that dismisses it permanently.
 * Shown only on the owner's account (the notes are written for her),
 * and only until dismissed. One note at a time by construction: this
 * component holds the current release's note and no other.
 */
const CURRENT_NOTE = {
  id: "r2",
  text: "Your main jobs have big buttons now, at the top of this page.",
};

export default async function DashboardNote() {
  const user = await getCurrentUser();
  if (!isGuideOwner(user?.username)) {
    return null;
  }
  const dismissed = await getSetting(`dashboard_note_dismissed_${CURRENT_NOTE.id}`);
  if (dismissed) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
      <p className="text-sm text-gray-800">{CURRENT_NOTE.text}</p>
      <form action={dismissDashboardNote.bind(null, CURRENT_NOTE.id)}>
        <button
          type="submit"
          className="min-h-[40px] rounded-lg bg-white px-4 py-2 text-sm font-medium text-primary border border-primary/40 hover:bg-primary/10 transition-colors"
        >
          Got it
        </button>
      </form>
    </div>
  );
}
