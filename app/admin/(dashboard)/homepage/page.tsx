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
  const [homepageJson, templateRaw, storedContent] = await Promise.all([
    getSetting("homepage_canvas"),
    getSetting("welcome_template"),
    getSetting("welcome_content"),
  ]);

  // The stored canvas document is still read for one thing: when no
  // template content was ever saved, the welcome words carry over from
  // the canvas so nothing she wrote is lost. The canvas editor itself
  // no longer appears on this page (Cal, 2026-11-24: hide it, do not
  // delete it). The CanvasEditor component, the saveHomepageCanvas
  // action and the stored document all stay in place, and the public
  // site still renders the canvas if the mode is ever set back.
  const { content, source } = resolveWelcomeContent(storedContent, homepageJson);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Homepage Editor</h1>

      <WelcomeSettingsForm
        initialTemplate={parseWelcomeTemplateId(templateRaw)}
        initialContent={content}
        contentSource={source}
      />
    </div>
  );
}
