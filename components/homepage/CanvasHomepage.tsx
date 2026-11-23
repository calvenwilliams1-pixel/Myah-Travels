import React from "react";
import { getSetting } from "@/lib/settings";
import CanvasRenderer from "@/components/editor/canvas/CanvasRenderer";
import { parseCanvasDocument } from "@/lib/canvas";

export default async function CanvasHomepage() {
  const homepageJson = await getSetting("homepage_canvas");

  // Nothing designed yet (or a broken document): render nothing, so the
  // homepage is simply the feed until the owner designs a welcome section
  // in the admin Homepage Editor.
  if (!homepageJson) {
    return null;
  }

  const doc = parseCanvasDocument(homepageJson);

  if (!doc) {
    return null;
  }

  return <CanvasRenderer document={doc} />;
}
