import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isGuideOwner, isGuideComplete } from "@/lib/guide";
import { getMoreGroups } from "@/components/admin/more-groups";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "More | MyCalTravels Admin",
};

/**
 * The More page (R4): one flat page of large tiles holding every
 * destination the old 12-link header had, grouped under Clients,
 * Content, and Setup. Nothing was removed, it just lives here now,
 * so the header itself can stay at Home, More, and View Site.
 */
export default async function MorePage() {
  const user = await getCurrentUser();
  const showGuide = isGuideOwner(user?.username) && !(await isGuideComplete());
  const groups = getMoreGroups(showGuide);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">More</h1>
        <p className="text-gray-500 mt-1">Everything else, grouped by the job it belongs to.</p>
      </div>

      {groups.map((group) => (
        <section key={group.heading}>
          <h2 className="text-lg font-semibold mb-3">{group.heading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl border border-gray-200 bg-white px-5 py-4 min-h-[64px] hover:border-primary/50 transition-colors"
              >
                <span className="block font-semibold text-gray-800">{link.label}</span>
                <span className="block text-sm text-gray-500 mt-0.5">{link.hint}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
