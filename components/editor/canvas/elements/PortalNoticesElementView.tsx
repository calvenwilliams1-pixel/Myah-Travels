"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PortalNoticesElementViewProps {
  element: CanvasElement;
}

export default function PortalNoticesElementView({ element }: PortalNoticesElementViewProps) {
  const data = element.portalNoticesData || {
    maxItems: 5,
    showPinnedOnly: false,
    showGlobalAnnouncements: true,
    title: "Notices",
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
      <span className="text-2xl mb-2">📢</span>
      <span className="text-sm font-semibold text-amber-800">{data.title}</span>
      <span className="text-xs text-amber-600 mt-2">
        {data.maxItems} notices max · {data.showPinnedOnly ? "Pinned only" : "All notices"}
      </span>
    </div>
  );
}
