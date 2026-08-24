import React from "react";
import FeedPage from "@/components/feed/FeedPage";
import { getFeedItems, getCategories } from "@/lib/feed";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getAllSettings();
  return {
    title: settings.site_name || "Myah Travels",
    description: settings.tagline || "Travel can be big or small and I'm here to write it all",
  };
}

export default async function HomePage() {
  const items = await getFeedItems("all", "newest", "all", 50, 0);
  const categories = await getCategories();

  return <FeedPage initialItems={items} categories={categories} />;
}
