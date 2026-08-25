"use client";

import React, { useRef, useState, useEffect } from "react";

interface CanvasScalerProps {
  designWidth: number;
  designHeight: number;
  children: React.ReactNode;
}

export default function CanvasScaler({ designWidth, designHeight, children }: CanvasScalerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(designWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, containerWidth / designWidth);
  const scaledHeight = designHeight * scale;

  return (
    <div ref={containerRef} className="w-full" style={{ height: scaledHeight }}>
      <div
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
