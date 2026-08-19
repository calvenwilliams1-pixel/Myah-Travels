import React from "react";
import { getAllSettings } from "@/lib/settings";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "About | Myah Travels",
  description: "Learn more about Myah, travel writer and agent.",
};

export default async function AboutPage() {
  const settings = await getAllSettings();

  const bio = settings.bio_text || 
    "Black mom of three and wife to the mushroom king, I've always loved to travel almost as much as I love to create a new world through writing. I'm at this beautiful point in my life where I want to combine my love for both and share that with you all.";

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-6">About Myah</h1>
      
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
