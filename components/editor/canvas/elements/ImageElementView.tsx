"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface ImageElementViewProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

export default function ImageElementView({ element, onUpdate }: ImageElementViewProps) {
  if (!element.assetId && !element.src) {
    return (
      <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50 cursor-pointer">
        <span className="text-gray-400 text-sm">Image placeholder</span>
      </div>
    );
  }

  return (
    <img
      src={element.src || `/api/assets/${element.assetId}`}
      alt={element.altText || ""}
      className="w-full h-full pointer-events-none"
      style={{
        objectFit: element.objectFit || "cover",
        borderRadius: element.borderRadius || 0,
      }}
    />
  );
}
