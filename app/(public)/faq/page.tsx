import React from "react";
import { db } from "@/lib/db";
import { pages } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import TipTapRenderer from "@/components/editor/TipTapRenderer";

export const revalidate = 3600;

export const metadata = {
  title: "FAQ | Myah Travels",
  description: "Frequently asked questions.",
};

export default async function FaqPage() {
  const page = await db.select().from(pages)
    .where(and(eq(pages.slug, "faq"), isNull(pages.deletedAt)))
    .limit(1);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-6">FAQ</h1>
      {page.length > 0 && page[0].isVisible ? (
        <TipTapRenderer content={page[0].content} />
      ) : (
        <p className="text-gray-500">FAQ coming soon.</p>
      )}
    </div>
  );
}
