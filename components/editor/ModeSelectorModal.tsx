"use client";

import React from "react";
import { EditorMode } from "@/types/canvas";

interface ModeSelectorModalProps {
  onSelect: (mode: EditorMode) => void;
}

export default function ModeSelectorModal({ onSelect }: ModeSelectorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <h2 className="text-2xl font-semibold text-center mb-2">
          Choose Your Post Style
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          This can't be changed after creation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("story")}
            className="border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-6 text-center transition-all"
          >
            <span className="text-4xl block mb-3">📝</span>
            <span className="text-lg font-semibold block">Story</span>
            <span className="text-xs text-gray-500 mt-2 block">
              Long-form writing with embedded visual elements
            </span>
            <span className="inline-block mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium">
              Create Story
            </span>
          </button>

          <button
            onClick={() => onSelect("design")}
            className="border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-6 text-center transition-all"
          >
            <span className="text-4xl block mb-3">🎨</span>
            <span className="text-lg font-semibold block">Design</span>
            <span className="text-xs text-gray-500 mt-2 block">
              Free-form visual layout with movable elements
            </span>
            <span className="inline-block mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium">
              Create Design
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
