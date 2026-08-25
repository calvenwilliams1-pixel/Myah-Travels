"use client";

import React, { useState, useRef } from "react";

interface ImageCropOverlayProps {
  imageSrc: string;
  initialCrop?: { x: number; y: number; width: number; height: number };
  onCropChange: (crop: { x: number; y: number; width: number; height: number }) => void;
  onClose: () => void;
}

export default function ImageCropOverlay({ imageSrc, initialCrop, onCropChange, onClose }: ImageCropOverlayProps) {
  const [crop, setCrop] = useState(initialCrop || { x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateCropPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateCropPosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateCropPosition = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const nextCrop = {
      ...crop,
      x: Math.max(0, Math.min(100 - crop.width, x - crop.width / 2)),
      y: Math.max(0, Math.min(100 - crop.height, y - crop.height / 2)),
    };

    setCrop(nextCrop);
    onCropChange(nextCrop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-xl p-4 max-w-2xl w-full">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Edit Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div
          ref={containerRef}
          className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="w-full h-full overflow-hidden">
            <img
              src={imageSrc}
              alt="Crop preview"
              className="w-full h-full object-cover pointer-events-none"
              style={{
                objectPosition: `${crop.x}% ${crop.y}%`,
                transform: `scale(${100 / crop.width})`,
                transformOrigin: "top left",
              }}
              draggable={false}
            />
          </div>
          <div
            className="absolute border-2 border-emerald-500 pointer-events-none"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
          />
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full py-2 bg-emerald-700 text-white rounded-lg text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
