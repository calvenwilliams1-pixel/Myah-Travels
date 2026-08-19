import React from "react";
import Link from "next/link";
import { getAllSettings } from "@/lib/settings";
import { Card } from "@/components/ui/Card";

export default async function AboutBlurb() {
  const settings = await getAllSettings();

  if (!settings.bio_text || settings.bio_text.trim() === "") {
    return null;
  }

  const words = settings.bio_text.trim().split(/\s+/);
  const bio = words.length > 30
    ? words.slice(0, 30).join(" ") + "..."
    : settings.bio_text;

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-4">
        <Card padding="lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
          <p className="text-gray-700 leading-relaxed mb-6">{bio}</p>
          <Link href="/about" className="text-emerald-700 font-medium hover:underline">
            Learn more about me →
          </Link>
        </Card>
      </div>
    </section>
  );
}
