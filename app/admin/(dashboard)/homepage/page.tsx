import React from "react";
import { getSetting } from "@/lib/settings";
import WelcomeSettingsForm from "./WelcomeSettingsForm";
import { parseWelcomeTemplateId, resolveWelcomeContent } from "@/lib/welcome";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage Editor | MyCalTravels Admin",
};

export default async function HomepageEditorPage() {
  const [templateRaw, storedContent] = await Promise.all([
    getSetting("welcome_template"),
    getSetting("welcome_content"),
  ]);

  const content = resolveWelcomeContent(storedContent);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Homepage Editor</h1>

      <WelcomeSettingsForm
        initialTemplate={parseWelcomeTemplateId(templateRaw)}
        initialContent={content}
      />
    </div>
  );
}
