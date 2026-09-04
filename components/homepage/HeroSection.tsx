import React from "react";
import Link from "next/link";
import { getAllSettings } from "@/lib/settings";

export default async function HeroSection() {
  const settings = await getAllSettings();

  return (
    <section className="bg-emerald-50 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold text-emerald-900 mb-4">
          {settings.site_name || "MyCalTravels"}
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          {settings.tagline || "Travel can be big or small and I'm here to write it all"}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 bg-emerald-700 text-white rounded-lg font-medium hover:bg-emerald-800 transition-colors"
          >
            Read My Stories
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-white text-emerald-700 border border-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
          >
            Start Planning
          </Link>
        </div>
      </div>
    </section>
  );
}
