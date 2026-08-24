import React from "react";
import { getSetting } from "@/lib/settings";
import CanvasRenderer from "@/components/editor/canvas/CanvasRenderer";
import { parseCanvasDocument } from "@/lib/canvas";

export default async function CanvasHomepage() {
  const homepageJson = await getSetting("homepage_canvas");

  if (!homepageJson) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Welcome to Myah Travels
        </h2>
        <p className="text-gray-500">
          Homepage content coming soon.
        </p>
      </div>
    );
  }

  const doc = parseCanvasDocument(homepageJson);

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-gray-500">
          Invalid homepage configuration. Please contact the administrator.
        </p>
      </div>
    );
  }

  return <CanvasRenderer document={doc} />;
}
