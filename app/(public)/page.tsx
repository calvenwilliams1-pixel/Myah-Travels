import React from "react";
import FeedPage from "@/components/feed/FeedPage";
import CanvasHomepage from "@/components/homepage/CanvasHomepage";
import { getFeedItems } from "@/lib/feed";
import { getAllTagsWithCounts } from "@/lib/content";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["all", "post", "guide", "review"] as const;
const VALID_SORTS = ["newest", "oldest", "pinned"] as const;

type FeedType = (typeof VALID_TYPES)[number];
type FeedSort = (typeof VALID_SORTS)[number];

function normaliseType(raw: unknown): FeedType {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" && (VALID_TYPES as readonly string[]).includes(v)
    ? (v as FeedType)
    : "all";
}

function normaliseSort(raw: unknown): FeedSort {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" && (VALID_SORTS as readonly string[]).includes(v)
    ? (v as FeedSort)
    : "pinned";
}

function normaliseTags(raw: unknown): string[] {
  const joined = Array.isArray(raw) ? raw.join(",") : raw;
  if (typeof joined !== "string" || !joined.trim()) return [];
  return joined
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]+$/.test(s))
    .slice(0, 10);
}

export async function generateMetadata() {
  const settings = await getAllSettings();
  return {
    title: settings.site_name || "MyCalTravels",
    description: settings.tagline || "Travel can be big or small and I'm here to write it all",
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: {
    type?: string | string[];
    sort?: string | string[];
    tags?: string | string[];
  };
}) {
  const type = normaliseType(searchParams.type);
  const sort = normaliseSort(searchParams.sort);
  const tagSlugs = normaliseTags(searchParams.tags);

  const [items, availableTags] = await Promise.all([
    getFeedItems(type, sort, 50, 0, tagSlugs),
    getAllTagsWithCounts(),
  ]);

  // The designed welcome section (admin Homepage Editor) shows only on
  // the plain homepage — not when a visitor is filtering or sorting the
  // feed, where it would just be in the way.
  const isDefaultView = type === "all" && sort === "pinned" && tagSlugs.length === 0;

  return (
    <>
      {isDefaultView && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <CanvasHomepage />
        </div>
      )}
      <FeedPage
        initialItems={items}
        initialType={type}
        initialSort={sort}
        initialTags={tagSlugs}
        availableTags={availableTags}
      />
    </>
  );
}
