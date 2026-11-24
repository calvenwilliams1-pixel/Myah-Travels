import React from "react";
import { getAllSettings } from "@/lib/settings";
import { WORDING_BY_KEY } from "@/lib/wording/registry";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "About | MyCalTravels",
  description: "Learn more about Myah, travel writer and agent.",
};

export default async function AboutPage() {
  const settings = await getAllSettings();

  // The fallback paragraph is the wording registry's bio_text
  // default, so the About page and the Wording editor share one
  // source for it.
  const bio = settings.bio_text || WORDING_BY_KEY.bio_text.defaultValue;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-h1 font-semibold mb-6">About Myah</h1>
      
      <Card>
        <p className="text-lg text-gray-700 leading-relaxed">
          {bio}
        </p>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Tagline</h2>
        <p className="text-gray-600">
          {settings.tagline || "Travel can be big or small and I'm here to write it all"}
        </p>
      </div>
    </div>
  );
}
