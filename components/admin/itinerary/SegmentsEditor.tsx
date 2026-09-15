"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import { REFERENCE_TYPES } from "@/lib/itineraries/referenceTypes";
import TravelLegFields, { type TravelLegDraft, type TravelMode } from "./TravelLegFields";
import type { Segment, TravelLeg } from "./ItineraryEditor";

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
            <label
              className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer"
              title="Highlight this segment"
            >
              <input
                type="checkbox"
                checked={!!segment.isHighlighted}
                onChange={(e) => {
                  update({ isHighlighted: e.target.checked } as any);
                  onChanged();
                }}
                className="cursor-pointer"
              />
              Highlight
            </label>
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

          {/* Expanded detail fields — kept mounted to preserve state; hidden via CSS when collapsed */}
          <div
            className={`mt-3 space-y-2 pl-6 border-l-2 border-gray-200 ${
              isExpanded ? "block" : "hidden"
            }`}
          >
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Type
                </label>
                <select
                  value={segment.referenceType || ""}
                  onChange={(e) => update({ referenceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                >
                  <option value="">— None —</option>
                  {REFERENCE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {segment.referenceType === "other" && (
                <AutosaveTextField
                  label="Custom Label"
                  value={segment.referenceLabel || ""}
                  onSave={(v) => update({ referenceLabel: v })}
                  draftKey={`segment:${segment.id}:referenceLabel`}
                  placeholder="Ticket Number"
                />
              )}

              {segment.referenceType && segment.referenceType !== "" && (
                <AutosaveTextField
                  label="Reference Value"
                  value={segment.confirmation || ""}
                  onSave={(v) => update({ confirmation: v })}
                  draftKey={`segment:${segment.id}:confirmation`}
                  placeholder="COPNYP"
                />
              )}

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


// ============================================
// TRAVEL LEGS LIST (edit mode)
// ============================================

function TravelLegsList({
  segmentId,
  legs,
  onChanged,
}: {
  segmentId: number;
  legs: TravelLeg[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<TravelLegDraft>({
    travelMode: "flight",
    origin: "",
    destination: "",
    departureAt: "",
    arrivalAt: "",
    originTimezone: "",
    destinationTimezone: "",
    operator: "",
    identifier: "",
    reference: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function addLeg() {
    setError(null);
    const res = await fetch(`/api/segments/${segmentId}/legs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travelMode: draft.travelMode,
        origin: draft.origin.trim() || undefined,
        destination: draft.destination.trim() || undefined,
        departureAt: draft.departureAt || undefined,
        arrivalAt: draft.arrivalAt || undefined,
        originTimezone: draft.originTimezone || undefined,
        destinationTimezone: draft.destinationTimezone || undefined,
        operator: draft.operator.trim() || undefined,
        identifier: draft.identifier.trim() || undefined,
        reference: draft.reference.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || data.error || "Failed to add leg");
      return;
    }
    setShowAdd(false);
    setDraft({
      travelMode: "flight", origin: "", destination: "", departureAt: "",
      arrivalAt: "", originTimezone: "", destinationTimezone: "",
      operator: "", identifier: "", reference: "",
    });
    onChanged();
  }

  return (
    <div className="space-y-2">
      {legs.map((leg, idx) => (
        <TravelLegRow key={leg.id} leg={leg} index={idx + 1} legCount={legs.length} onChanged={onChanged} />
      ))}

      {showAdd ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-2">
          <TravelLegFields
            leg={draft}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
            index={legs.length + 1}
          />
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={() => { setShowAdd(false); setError(null); }}>Cancel</Button>
            <Button onClick={addLeg}>Add Leg</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary"
        >
          + Add another leg
        </button>
      )}
    </div>
  );
}

function TravelLegRow({
  leg,
  index,
  legCount,
  onChanged,
}: {
  leg: TravelLeg;
  index: number;
  legCount: number;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<TravelLegDraft>({
    travelMode: (leg.travelMode as TravelMode) || "flight",
    origin: leg.origin || "",
    destination: leg.destination || "",
    departureAt: leg.departureAt || "",
    arrivalAt: leg.arrivalAt || "",
    originTimezone: leg.originTimezone || "",
    destinationTimezone: leg.destinationTimezone || "",
    operator: leg.operator || "",
    identifier: leg.identifier || "",
    reference: leg.reference || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveLeg() {
    setIsSaving(true);
    setError(null);
    const res = await fetch(`/api/legs/${leg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        travelMode: draft.travelMode,
        origin: draft.origin.trim() || undefined,
        destination: draft.destination.trim() || undefined,
        departureAt: draft.departureAt || undefined,
        arrivalAt: draft.arrivalAt || undefined,
        originTimezone: draft.originTimezone || undefined,
        destinationTimezone: draft.destinationTimezone || undefined,
        operator: draft.operator.trim() || undefined,
        identifier: draft.identifier.trim() || undefined,
        reference: draft.reference.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.message || data.error || "Failed to save leg");
    }
    setIsSaving(false);
  }

  async function removeLeg() {
    if (!confirm("Delete this leg?")) return;
    const res = await fetch(`/api/legs/${leg.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete leg");
      return;
    }
    onChanged();
  }

  return (
    <div>
      <TravelLegFields
        leg={draft}
        index={index}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
        onRemove={removeLeg}
        canRemove={legCount > 1}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <Button onClick={saveLeg} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Leg"}
        </Button>
      </div>
    </div>
  );
}
