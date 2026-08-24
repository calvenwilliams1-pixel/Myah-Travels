"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PdfElementViewProps {
  element: CanvasElement;
}

export default function PdfElementView({ element }: PdfElementViewProps) {
  const { displayMode = "thumbnail", fileName = "", src = "", assetId } = element;

  if (!src && !assetId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50">
        <span className="text-2xl mb-1">📄</span>
        <span className="text-gray-400 text-xs">PDF placeholder</span>
      </div>
    );
  }

  const fileUrl = src || `/api/assets/${assetId}`;

  if (displayMode === "download") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg">
        <span className="text-3xl mb-1">📄</span>
        <span className="text-sm font-medium text-gray-700">{fileName || "Download PDF"}</span>
        <span className="text-xs text-emerald-700 mt-1">Click to Download</span>
      </div>
    );
  }

  if (displayMode === "full") {
    return (
      <div className="w-full h-full bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden">
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full"
          title={fileName || "PDF Viewer"}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-gray-200 rounded-lg">
      <span className="text-4xl mb-2">📄</span>
      <span className="text-sm font-medium text-gray-700">{fileName || "PDF Document"}</span>
      <span className="text-xs text-gray-400 mt-1">Click to view</span>
    </div>
  );
}
