import React from "react";
import HeroSection from "@/components/homepage/HeroSection";
import AboutBlurb from "@/components/homepage/AboutBlurb";
import FeaturedContent from "@/components/homepage/FeaturedContent";
import FeaturedVideo from "@/components/homepage/FeaturedVideo";
import CallToAction from "@/components/homepage/CallToAction";
import { getAllSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getAllSettings();
  return {
    title: settings.site_name || "Myah Travels",
    description: settings.tagline || "Travel can be big or small and I'm here to write it all",
  };
}

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <AboutBlurb />
      <FeaturedContent />
      <FeaturedVideo />
      <CallToAction />
    </div>
  );
}
