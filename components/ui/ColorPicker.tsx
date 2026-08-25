"use client";

import React, { useState, useEffect } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = (input: string) => {
    setHexInput(input);
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input)) {
      onChange(input);
    }
  };

  return (
    <div className="relative">
      {label && <label className="text-xs text-gray-600 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 rounded border-2 border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value }}
          aria-label={`Pick ${label || "color"}`}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono min-w-0"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
      {showPicker && (
        <div className="absolute z-10 mt-1 left-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 cursor-pointer"
            aria-label={`${label || "color"} picker`}
          />
        </div>
      )}
    </div>
  );
}
