"use client";

import React, { useRef, useState } from "react";

interface MarqueeSelectionProps {
  onSelect: (rect: { x: number; y: number; width: number; height: number }) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export default function MarqueeSelection({ onSelect, canvasWidth, canvasHeight }: MarqueeSelectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getRelativePos(e);
    setIsDragging(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentPos(getRelativePos(e));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const rect = {
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    };
    if (rect.width > 5 && rect.height > 5) {
      onSelect(rect);
    }
  };

  const marqueeStyle = isDragging
    ? {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
      }
    : null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="absolute inset-0 z-0"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {marqueeStyle && (
        <div
          className="absolute border-2 border-emerald-500 bg-emerald-100 bg-opacity-20 pointer-events-none"
          style={marqueeStyle}
        />
      )}
    </div>
  );
}
