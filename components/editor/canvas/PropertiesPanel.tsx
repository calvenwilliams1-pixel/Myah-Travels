"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PropertiesPanelProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const FONT_OPTIONS = ["Inter", "Open Sans", "Roboto", "Lato", "Source Sans Pro"];
const FONT_SIZE_OPTIONS = [
  { label: "Small", value: 14 },
  { label: "Body", value: 16 },
  { label: "Heading", value: 24 },
  { label: "Title", value: 36 },
  { label: "Hero", value: 48 },
];
const BRAND_COLORS = [
  "#4a7c59",
  "#e8b84b",
  "#6b9ac4",
  "#333333",
  "#ffffff",
  "#f5f5f5",
];

export default function PropertiesPanel({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  return (
    <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
      <div className="p-4 space-y-5">
        {/* Header */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{element.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{element.type}</p>
        </div>

        {/* Lock / Visibility toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(element.id, { locked: !element.locked })}
            className={`flex-1 px-2 py-1.5 rounded text-xs border ${
              element.locked
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {element.locked ? "🔒 Locked" : "🔓 Unlocked"}
          </button>
          <button
            onClick={() => onUpdate(element.id, { visible: !element.visible })}
            className={`flex-1 px-2 py-1.5 rounded text-xs border ${
              element.visible
                ? "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {element.visible ? "👁 Visible" : "🚫 Hidden"}
          </button>
        </div>

        {/* Position & Size */}
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
              onChange={(e) => onUpdate(element.id, { width: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Height
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onUpdate(element.id, { height: Number(e.target.value) })}
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </label>
        </div>

        {/* Rotation */}
        <label className="text-xs text-gray-600 block">
          Rotation (degrees)
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => onUpdate(element.id, { rotation: Number(e.target.value) })}
            className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </label>

        {/* Text properties */}
        {element.type === "text" && (
          <>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Font Family</label>
              <select
                value={element.fontFamily || "Inter"}
                onChange={(e) => onUpdate(element.id, { fontFamily: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Font Size</label>
              <select
                value={element.fontSize || 16}
                onChange={(e) => onUpdate(element.id, { fontSize: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size.value} value={size.value}>{size.label} ({size.value}px)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Alignment</label>
              <div className="flex gap-1">
                {["left", "center", "right"].map((align) => (
                  <button
                    key={align}
                    onClick={() => onUpdate(element.id, { textAlign: align })}
                    className={`flex-1 px-2 py-1 rounded text-sm border ${
                      element.textAlign === align
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Weight</label>
              <div className="flex gap-1">
                {["normal", "bold"].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => onUpdate(element.id, { fontWeight: weight })}
                    className={`flex-1 px-2 py-1 rounded text-sm border ${
                      element.fontWeight === weight
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {weight === "bold" ? "B" : "Regular"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Shape properties */}
        {element.type === "shape" && (
          <>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Shape Type</label>
              <select
                value={element.shapeType || "square"}
                onChange={(e) => onUpdate(element.id, { shapeType: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
                <option value="line">Line</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Border Width</label>
              <input
                type="range"
                min={0}
                max={20}
                value={element.borderWidth || 0}
                onChange={(e) => onUpdate(element.id, { borderWidth: Number(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{element.borderWidth || 0}px</span>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Border Radius</label>
              <input
                type="range"
                min={0}
                max={100}
                value={element.borderRadius || 0}
                onChange={(e) => onUpdate(element.id, { borderRadius: Number(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{element.borderRadius || 0}px</span>
            </div>
          </>
        )}

        {/* Color pickers */}
        {(element.type === "text" || element.type === "shape" || element.type === "button") && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              {element.type === "text" ? "Text Color" : element.type === "button" ? "Background" : "Fill Color"}
            </label>
            <div className="flex gap-1 flex-wrap">
              {BRAND_COLORS.map((color) => {
                const currentColor =
                  element.type === "text"
                    ? element.color
                    : element.type === "button"
                    ? element.backgroundColor
                    : element.fillColor;
                return (
                  <button
                    key={color}
                    onClick={() => {
                      if (element.type === "text") {
                        onUpdate(element.id, { color });
                      } else if (element.type === "button") {
                        onUpdate(element.id, { backgroundColor: color });
                      } else {
                        onUpdate(element.id, { fillColor: color });
                      }
                    }}
                    className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-emerald-500 transition-colors"
                    style={{
                      backgroundColor: color,
                      outline: currentColor === color ? "2px solid #4a7c59" : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
        {/* Portal Dates properties */}
        {element.type === "portal_dates" && (() => {
          const data = {
            label: "Trip Dates",
            showDeparture: true,
            showReturn: true,
            showCountdown: true,
            ...element.portalDatesData,
          };

          return (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Label</label>
                <input
                  type="text"
                  value={data.label}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalDatesData: { ...data, label: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={data.showDeparture}
                    onChange={(e) =>
                      onUpdate(element.id, {
                        portalDatesData: { ...data, showDeparture: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  Show Departure
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={data.showReturn}
                    onChange={(e) =>
                      onUpdate(element.id, {
                        portalDatesData: { ...data, showReturn: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  Show Return
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={data.showCountdown}
                    onChange={(e) =>
                      onUpdate(element.id, {
                        portalDatesData: { ...data, showCountdown: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  Show Countdown
                </label>
              </div>
            </>
          );
        })()}

        {/* Portal Notices properties */}
        {element.type === "portal_notices" && (() => {
          const data = {
            title: "Notices",
            maxItems: 5,
            showPinnedOnly: false,
            showGlobalAnnouncements: true,
            ...element.portalNoticesData,
          };

          return (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalNoticesData: { ...data, title: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Max Items</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={data.maxItems}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalNoticesData: { ...data, maxItems: Math.max(1, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={data.showPinnedOnly}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalNoticesData: { ...data, showPinnedOnly: e.target.checked },
                    })
                  }
                  className="rounded"
                />
                Show Pinned Only
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={data.showGlobalAnnouncements}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalNoticesData: { ...data, showGlobalAnnouncements: e.target.checked },
                    })
                  }
                  className="rounded"
                />
                Show Global Announcements
              </label>
            </>
          );
        })()}

        {/* Portal Documents properties */}
        {element.type === "portal_documents" && (() => {
          const data = {
            title: "Documents",
            maxItems: 10,
            showFileType: true,
            ...element.portalDocumentsData,
          };

          return (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalDocumentsData: { ...data, title: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Max Items</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={data.maxItems}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalDocumentsData: { ...data, maxItems: Math.max(1, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={data.showFileType}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalDocumentsData: { ...data, showFileType: e.target.checked },
                    })
                  }
                  className="rounded"
                />
                Show File Type
              </label>
            </>
          );
        })()}

        {/* Portal FAQs properties */}
        {element.type === "portal_faqs" && (() => {
          const data = {
            title: "FAQs",
            maxItems: 10,
            ...element.portalFaqsData,
          };

          return (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalFaqsData: { ...data, title: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Max Items</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={data.maxItems}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      portalFaqsData: { ...data, maxItems: Math.max(1, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </>
          );
        })()}

        {/* Opacity */}
        {(element.type === "shape" || element.type === "image") && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              value={(element.opacity || 1) * 100}
              onChange={(e) => onUpdate(element.id, { opacity: Number(e.target.value) / 100 })}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{Math.round((element.opacity || 1) * 100)}%</span>
          </div>
        )}

        {/* Layer Order */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">Layer Order</label>
          <div className="flex gap-2">
            <button
              onClick={onBringForward}
              className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
            >
              Forward
            </button>
            <button
              onClick={onSendBackward}
              className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
            >
              Backward
            </button>
          </div>
        </div>

        {/* Actions */}
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
