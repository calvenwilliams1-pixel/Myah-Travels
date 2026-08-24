"use client";

import React, { useState } from "react";
import { CanvasElement } from "@/types/canvas";

interface LayersPanelProps {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function LayersPanel({
  elements,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onRename,
}: LayersPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sorted = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  const startRename = (el: CanvasElement) => {
    setRenamingId(el.id);
    setRenameValue(el.name || el.type);
  };

  const commitRename = (id: string) => {
    const value = renameValue.trim();
    if (value !== "") {
      onRename(id, value);
    }
    setRenamingId(null);
  };

  return (
    <aside className="w-48 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Layers</h3>
        <p className="text-xs text-gray-400 mb-3">{elements.length} elements</p>

        <ul className="space-y-0.5">
          {sorted.map((el) => (
            <li
              key={el.id}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${
                selectedIds.includes(el.id)
                  ? "bg-emerald-50 text-emerald-800"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              onClick={() => onSelect([el.id])}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(el.id);
                }}
                className="w-5 text-center text-xs flex-shrink-0"
                title={el.visible ? "Hide" : "Show"}
              >
                {el.visible ? "👁" : "🚫"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(el.id);
                }}
                className="w-5 text-center text-xs flex-shrink-0"
                title={el.locked ? "Unlock" : "Lock"}
              >
                {el.locked ? "🔒" : "🔓"}
              </button>

              {renamingId === el.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(el.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(el.id);
                    if (e.key === "Escape") {
                      setRenameValue("");
                      setRenamingId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-1 py-0.5 border border-emerald-300 rounded text-xs"
                />
              ) : (
                <span
                  className="flex-1 truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(el);
                  }}
                >
                  {el.name || el.type}
                </span>
              )}
            </li>
          ))}
        </ul>

        {elements.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">No elements yet.</p>
        )}
      </div>
    </aside>
  );
}
