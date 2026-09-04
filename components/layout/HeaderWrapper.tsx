import React from "react";
import Header from "./Header";
import { getAllSettings } from "@/lib/settings";

export default async function HeaderWrapper() {
  const settings = await getAllSettings();
  return (
    <Header
      siteName={settings.site_name || "MyCalTravels"}
      logoPath={settings.logo_path}
    />
  );
}
