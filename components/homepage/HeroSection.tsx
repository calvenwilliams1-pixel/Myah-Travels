import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllSettings, getSetting } from "@/lib/settings";

/**
 * The standard homepage hero (UI style plan, Pass 1a item 5).
 *
 * Image rules, applied here and reused by the welcome templates
 * (Pass 1b) and the itinerary cover (Pass 2a):
 * - a photo, when set, renders full-bleed through next/image
 *   (sized for the viewport — bytes are a budget on a home server);
 * - a guaranteed gradient scrim (.hero-scrim) sits over the photo so
 *   overlay text stays readable on dark, bright, or busy images;
 * - the focal point recorded with the image drives object-position,
 *   so the subject survives phone and desktop crops;
 * - with no photo, the brand gradient (.hero-fallback) carries the
 *   section instead.
 */
export default async function HeroSection() {
  const settings = await getAllSettings();
  const heroImage = await getSetting("hero_image");
  const heroFocal = (await getSetting("hero_focal")) || "50% 50%";

  return (
    <section className="hero-fallback relative overflow-hidden">
      {heroImage ? (
        <>
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: heroFocal }}
          />
          <div className="hero-scrim" aria-hidden="true" />
        </>
      ) : null}
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center md:py-24">
        <h1 className="mb-4 text-display font-semibold text-white">
          {settings.site_name || "MyCalTravels"}
        </h1>
        <p className="mb-8 text-xl text-white/90">
          {settings.tagline || "Travel can be big or small and I'm here to write it all"}
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/blog"
            className="rounded-lg bg-white px-6 py-3 font-medium text-primary-dark transition-colors hover:bg-white/90"
          >
            Read My Stories
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-white px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            Start Planning
          </Link>
        </div>
      </div>
    </section>
  );
}
