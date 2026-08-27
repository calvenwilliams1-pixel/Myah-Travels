"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";
import ColorPicker from "@/components/ui/ColorPicker";

interface PropertiesPanelProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export default function PropertiesPanel({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  const displayName = element.name || element.type;

  return (
    <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
      <div className="p-4 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{displayName}</h3>
          <p className="text-xs text-gray-500 capitalize">{element.type}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(element.id, { locked: !(element.locked ?? false) })}
            className={`flex-1 px-2 py-1.5 rounded text-xs border ${
              element.locked
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            {element.locked ? "Locked" : "Unlocked"}
          </button>
          <button
            onClick={() => onUpdate(element.id, { visible: element.visible === false })}
            className={`flex-1 px-2 py-1.5 rounded text-xs border ${
              element.visible === false
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            {element.visible === false ? "Hidden" : "Visible"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-gray-600">
            X
            <input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => onUpdate(element.id, { x: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Y
            <input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => onUpdate(element.id, { y: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Width
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => onUpdate(element.id, { width: Math.max(1, Number(e.target.value)) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Height
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onUpdate(element.id, { height: Math.max(1, Number(e.target.value)) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
        </div>

        <label className="text-xs text-gray-600 block">
          Rotation
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => {
              const num = Number(e.target.value);
              const normalized = isNaN(num) ? 0 : ((num % 360) + 360) % 360;
              onUpdate(element.id, { rotation: normalized });
            }}
            className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </label>

        {element.type === "text" && (
          <ColorPicker
            label="Text Color"
            value={element.color ?? "#333333"}
            onChange={(color) => onUpdate(element.id, { color })}
          />
        )}

        {element.type === "shape" && (
          <>
            <ColorPicker
              label="Fill Color"
              value={element.fillColor ?? "#e8b84b"}
              onChange={(color) => onUpdate(element.id, { fillColor: color })}
            />
            <ColorPicker
              label="Border Color"
              value={element.borderColor ?? "#333333"}
              onChange={(color) => onUpdate(element.id, { borderColor: color })}
            />
          </>
        )}

        {element.type === "button" && (
          <>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Link URL</label>
              <input
                type="text"
                value={element.link ?? ""}
                onChange={(e) => onUpdate(element.id, { link: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="https://..."
              />
            </div>
            <ColorPicker
              label="Background Color"
              value={element.backgroundColor ?? "#4a7c59"}
              onChange={(color) => onUpdate(element.id, { backgroundColor: color })}
            />
            <ColorPicker
              label="Text Color"
              value={element.textColor ?? "#ffffff"}
              onChange={(color) => onUpdate(element.id, { textColor: color })}
            />
          </>
        )}

        {element.type === "divider" && (
          <ColorPicker
            label="Line Color"
            value={element.color ?? "#cccccc"}
            onChange={(color) => onUpdate(element.id, { color })}
          />
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onDuplicate}
            className="flex-1 px-2 py-1.5 bg-gray-100 rounded text-xs hover:bg-gray-200"
          >
            Duplicate
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-2 py-1.5 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}
