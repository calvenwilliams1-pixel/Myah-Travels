import React from "react";
import Link from "next/link";
import { getGuides } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "Destination Guides | Myah Travels",
  description: "Comprehensive destination guides from Myah.",
};

export default async function GuidesPage() {
  const guides = await getGuides({ status: "published" });

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Destination Guides</h1>
      <p className="text-gray-600 mb-8">In-depth guides to help you plan.</p>

      {guides.length > 0 ? (
        <div className="space-y-6">
          {guides.map((guide) => (
            <Card key={guide.id} padding="md">
              <Link href={`/guides/${guide.slug}`} className="block hover:text-emerald-700">
                <h2 className="text-xl font-semibold mb-2">{guide.title}</h2>
                {guide.excerpt && (
                  <p className="text-gray-600 text-sm mb-3">{guide.excerpt}</p>
                )}
                <p className="text-xs text-gray-400">
                  Updated: {new Date(guide.updatedAt || guide.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No guides yet. Check back soon!</p>
      )}
    </div>
  );
}
