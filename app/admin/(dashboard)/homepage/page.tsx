import React from "react";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import { getSetting } from "@/lib/settings";
import { saveHomepageCanvas } from "./actions";
import WelcomeSettingsForm from "./WelcomeSettingsForm";
import { parseCanvasDocument } from "@/lib/canvas/parse";
import {
  canvasMatchesStarterShape,
  parseWelcomeTemplateId,
  resolveWelcomeContent,
  summarizeCanvasContent,
} from "@/lib/welcome";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage Editor | MyCalTravels Admin",
};

export default async function HomepageEditorPage() {
  const [homepageJson, modeRaw, templateRaw, storedContent] = await Promise.all([
    getSetting("homepage_canvas"),
    getSetting("welcome_mode"),
    getSetting("welcome_template"),
    getSetting("welcome_content"),
  ]);

  const { content, source } = resolveWelcomeContent(storedContent, homepageJson);
  const canvasDoc = homepageJson ? parseCanvasDocument(homepageJson) : null;
  const legacySummary =
    source === "blank" && canvasDoc && !canvasMatchesStarterShape(canvasDoc)
      ? summarizeCanvasContent(canvasDoc)
      : "";

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Homepage Editor</h1>

      <WelcomeSettingsForm
        initialMode={modeRaw === "template" ? "template" : "canvas"}
        initialTemplate={parseWelcomeTemplateId(templateRaw)}
        initialContent={content}
        contentSource={source}
        legacySummary={legacySummary}
      />

      <h2 className="text-lg font-semibold mb-1">Canvas editor</h2>
      <p className="text-sm text-gray-500 mb-6">
        The freeform designer. It&apos;s what visitors see while the welcome section above is set
        to Canvas. Changes autosave.
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <CanvasEditor
          initialDocument={homepageJson || undefined}
          contentType="homepage"
          onSave={saveHomepageCanvas}
        />
      </div>
    </div>
  );
}
