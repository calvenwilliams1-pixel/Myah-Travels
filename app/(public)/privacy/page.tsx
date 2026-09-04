import React from "react";
import { db } from "@/lib/db";
import { pages } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import TipTapRenderer from "@/components/editor/TipTapRenderer";

export const revalidate = 3600;

export const metadata = {
  title: "Privacy Policy | MyCalTravels",
  description: "Privacy policy for MyCalTravels.",
};

export default async function PrivacyPage() {
  const page = await db.select().from(pages)
    .where(and(eq(pages.slug, "privacy"), isNull(pages.deletedAt)))
    .limit(1);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-6">Privacy Policy</h1>
      {page.length > 0 && page[0].isVisible ? (
        <TipTapRenderer content={page[0].content} />
      ) : (
        <p className="text-gray-500">Privacy policy coming soon.</p>
      )}
    </div>
  );
}
