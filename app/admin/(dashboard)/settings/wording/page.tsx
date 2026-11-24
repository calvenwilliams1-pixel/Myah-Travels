import React from "react";
import Link from "next/link";
import { loadWordingOverrides } from "@/lib/wording";
import { WORDING_REGISTRY } from "@/lib/wording/registry";
import WordingForm from "./WordingForm";

export const dynamic = "force-dynamic";

export default async function WordingPage() {
  const overrides = await loadWordingOverrides();

  const initial: Record<string, { value: string; hasOverride: boolean }> = {};
  for (const entry of WORDING_REGISTRY) {
    const stored = overrides[entry.settingsKey];
    initial[entry.key] = {
      value: stored ?? "",
      hasOverride: stored !== undefined && stored.trim() !== "",
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/settings"
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          ← Back to Settings
        </Link>
        <h2 className="text-2xl font-semibold mt-2">Words clients read</h2>
        <p className="text-gray-600 mt-1 max-w-2xl">
          These are the words in the email clients get when you add them to a portal,
          on the page they land on, and in the messages they see if a link runs out.
          Leave a field empty and the standard words are used, so nothing ever shows
          up blank.
        </p>
      </div>

      <WordingForm initial={initial} />
    </div>
  );
}
