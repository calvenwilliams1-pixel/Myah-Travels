import React from "react";
import CanvasHomepage from "@/components/homepage/CanvasHomepage";
import { getAllSettings } from "@/lib/settings";

export async function generateMetadata() {
  const settings = await getAllSettings();
  return {
    title: settings.site_name || "Myah Travels",
    description: settings.tagline || "Travel can be big or small and I'm here to write it all",
  };
}

export default function HomePage() {
  return <CanvasHomepage />;
}
