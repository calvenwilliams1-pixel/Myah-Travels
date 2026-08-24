"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PortalFaqsElementViewProps {
  element: CanvasElement;
}

export default function PortalFaqsElementView({ element }: PortalFaqsElementViewProps) {
  const data = element.portalFaqsData || {
    maxItems: 10,
    title: "FAQs",
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
      <span className="text-2xl mb-2">❓</span>
      <span className="text-sm font-semibold text-purple-800">{data.title}</span>
      <span className="text-xs text-purple-600 mt-2">
        {data.maxItems} FAQs max
      </span>
    </div>
  );
}
