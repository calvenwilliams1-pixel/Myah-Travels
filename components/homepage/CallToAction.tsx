import React from "react";
import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="py-20 bg-emerald-700">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-semibold text-white mb-4">
          Ready to plan your trip?
        </h2>
        <p className="text-emerald-100 mb-8">
          Let's create something amazing together.
        </p>
        <Link
          href="/contact"
          className="inline-block px-8 py-3 bg-white text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
        >
          Start Planning
        </Link>
      </div>
    </section>
  );
}
