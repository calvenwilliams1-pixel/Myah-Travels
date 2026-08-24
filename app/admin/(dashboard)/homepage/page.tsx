import React from "react";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import { getSetting } from "@/lib/settings";
import { saveHomepageCanvas } from "./actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Homepage Editor | Myah Travels Admin",
};

export default async function HomepageEditorPage() {
  const homepageJson = await getSetting("homepage_canvas");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Homepage Editor</h1>
      <p className="text-sm text-gray-500 mb-6">
        Design your homepage using the canvas editor. Changes autosave.
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
