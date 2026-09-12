"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import type { Segment } from "./ItineraryEditor";

interface SegmentsEditorProps {
  dayId: number;
  segments: Segment[];
  onChanged: () => void;
}

const TYPE_STYLES: Record<
  string,
  { bg: string; border: string; icon: string; label: string }
> = {
  activity: { bg: "bg-primary/5", border: "border-primary/20", icon: "🎯", label: "Activity" },
  travel: { bg: "bg-info/5", border: "border-info/20", icon: "✈️", label: "Travel" },
  meal: { bg: "bg-warning/5", border: "border-warning/20", icon: "🍽️", label: "Meal" },
  free_day: { bg: "bg-gray-50", border: "border-gray-200", icon: "🌴", label: "Free Day" },
};

export default function SegmentsEditor({
  dayId,
  segments,
  onChanged,
}: SegmentsEditorProps) {
  if (segments.length === 0) {
    return (
      <p className="text-xs text-gray-400 pl-2 italic">
        No segments — will render as &quot;No activities scheduled&quot;
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {segments.map((seg) => (
        <SegmentRow key={seg.id} segment={seg} onChanged={onChanged} />
      ))}
    </div>
  );
}

function SegmentRow({
  segment,
  onChanged,
}: {
  segment: Segment;
  onChanged: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const style = TYPE_STYLES[segment.type] || TYPE_STYLES.activity;

  async function update(data: Partial<Segment>) {
    await fetch(`/api/segments/${segment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function remove() {
    if (!confirm("Delete this segment?")) return;
    await fetch(`/api/segments/${segment.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-2`}>
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{style.icon}</span>
        <div className="flex-1 min-w-0">
          {/* Collapsed header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {style.label}
            </span>
            {segment.type !== "travel" && segment.startTime && (
              <span className="text-xs text-gray-500">
                {segment.startTime}
                {segment.endTime && ` – ${segment.endTime}`}
              </span>
            )}
            {segment.type === "travel" && segment.departureAirport && segment.arrivalAirport && (
              <span className="text-xs text-gray-500">
                {segment.departureAirport} → {segment.arrivalAirport}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? "Collapse" : "Edit"}
            </button>
            <button
              type="button"
              onClick={remove}
              className="text-red-500 hover:text-red-700 text-xs"
              aria-label="Delete segment"
            >
              ✕
            </button>
          </div>

          {/* Title always visible */}
          <div className="mt-2">
            <AutosaveTextField
              value={segment.title}
              onSave={(v) => update({ title: v })}
              draftKey={`segment:${segment.id}:title`}
              placeholder="Segment title"
            />
          </div>

          {/* Expanded detail fields */}
          {isExpanded && (
            <div className="mt-3 space-y-2 pl-6 border-l-2 border-gray-200">
              {segment.type === "travel" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <AutosaveTextField
                      label="From"
                      value={segment.departureAirport || ""}
                      onSave={(v) => update({ departureAirport: v })}
                      draftKey={`segment:${segment.id}:departureAirport`}
                      placeholder="YYZ"
                    />
                    <AutosaveTextField
                      label="To"
                      value={segment.arrivalAirport || ""}
                      onSave={(v) => update({ arrivalAirport: v })}
                      draftKey={`segment:${segment.id}:arrivalAirport`}
                      placeholder="NRT"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AutosaveTextField
                      label="Airline"
                      value={segment.airline || ""}
                      onSave={(v) => update({ airline: v })}
                      draftKey={`segment:${segment.id}:airline`}
                      placeholder="Air Canada"
                    />
                    <AutosaveTextField
                      label="Flight #"
                      value={segment.flightNumber || ""}
                      onSave={(v) => update({ flightNumber: v })}
                      draftKey={`segment:${segment.id}:flightNumber`}
                      placeholder="AC0009"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <AutosaveTextField
                      label="Start Time"
                      value={segment.startTime || ""}
                      onSave={(v) => update({ startTime: v })}
                      draftKey={`segment:${segment.id}:startTime`}
                      placeholder="14:00"
                    />
                    <AutosaveTextField
                      label="End Time"
                      value={segment.endTime || ""}
                      onSave={(v) => update({ endTime: v })}
                      draftKey={`segment:${segment.id}:endTime`}
                      placeholder="16:30"
                    />
                  </div>
                  <AutosaveTextField
                    label="Location"
                    value={segment.location || ""}
                    onSave={(v) => update({ location: v })}
                    draftKey={`segment:${segment.id}:location`}
                    placeholder="Sumida, Tokyo"
                  />
                </>
              )}

              <AutosaveTextField
                label="Confirmation"
                value={segment.confirmation || ""}
                onSave={(v) => update({ confirmation: v })}
                draftKey={`segment:${segment.id}:confirmation`}
                placeholder="COPNYP"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <InstructionsField
                  value={segment.instructions || ""}
                  onSave={(v) => update({ instructions: v })}
                  draftKey={`segment:${segment.id}:instructions`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructionsField({
  value,
  onSave,
  draftKey,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  draftKey: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  // Defer to blur for save — textareas don't autosave well
  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) {
          onSave(localValue);
        }
      }}
      placeholder="Meet at hotel lobby 15 min early. Bring passport."
      rows={2}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
    />
  );
}
