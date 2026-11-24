import React from "react";
import Link from "next/link";
import { loadWordingOverrides, loadEmailIdentity } from "@/lib/wording";
import { WORDING_REGISTRY, resolveAllWording, formatExpiryLabel } from "@/lib/wording/registry";
import WordingStudio from "./WordingStudio";

export const dynamic = "force-dynamic";

export default async function WordingPage() {
  const overrides = await loadWordingOverrides();
  const identity = await loadEmailIdentity();
  const resolved = resolveAllWording(overrides);

  const initial: Record<string, { value: string; hasOverride: boolean }> = {};
  for (const entry of WORDING_REGISTRY) {
    const stored = overrides[entry.settingsKey];
    initial[entry.key] = {
      value: resolved[entry.key],
      hasOverride: stored !== undefined && stored.trim() !== "",
    };
  }

  const sampleDate = new Date();
  sampleDate.setDate(sampleDate.getDate() + 30);

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
          Pick one below and you will see it the way a client does. Change the words
          right on it.
        </p>
      </div>

      <WordingStudio
        initial={initial}
        siteName={identity.siteName ?? ""}
        primaryColor={identity.primaryColor ?? ""}
        instagramUrl={identity.instagramUrl ?? ""}
        youtubeUrl={identity.youtubeUrl ?? ""}
        sampleExpiryLabel={formatExpiryLabel(sampleDate)}
      />
    </div>
  );
}
