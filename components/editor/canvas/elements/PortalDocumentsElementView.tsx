"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PortalDocumentsElementViewProps {
  element: CanvasElement;
}

export default function PortalDocumentsElementView({ element }: PortalDocumentsElementViewProps) {
  const data = element.portalDocumentsData || {
    maxItems: 10,
    showFileType: true,
    title: "Documents",
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-green-50 border-2 border-green-200 rounded-lg p-4">
      <span className="text-2xl mb-2">📁</span>
      <span className="text-sm font-semibold text-green-800">{data.title}</span>
      <span className="text-xs text-green-600 mt-2">
        {data.maxItems} documents max
      </span>
    </div>
  );
}
