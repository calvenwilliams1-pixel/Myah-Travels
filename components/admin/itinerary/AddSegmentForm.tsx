"use client";

import { openPickerOnClick } from "@/lib/ui/openPicker";
import { REFERENCE_TYPES } from "@/lib/itineraries/referenceTypes";
import TravelLegFields, { EMPTY_LEG, type TravelLegDraft, type TravelMode } from "./TravelLegFields";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddSegmentFormProps {
  dayId: number;
  dayDate: string;   // YYYY-MM-DD
  onSaved: () => void;
  onCancel: () => void;
}

// Compute min/max datetime-local strings for flight pickers:
// Allow a 1-day buffer on each side of the day's date so flights that
// depart late on the previous day or arrive early the next day are valid.
function computeDatetimeBounds(dayDate: string): { min: string; max: string } {
  try {
    const day = new Date(dayDate + "T00:00:00");
    const dayBefore = new Date(day);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(day);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const toLocalString = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T00:00`;
    };

    const toLocalEnd = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T23:59`;
    };

    return {
      min: toLocalString(dayBefore),
      max: toLocalEnd(dayAfter),
    };
  } catch {
    return { min: "", max: "" };
  }
}

type SegmentType = "activity" | "travel" | "meal" | "free_day";

const SEGMENT_TYPE_OPTIONS = [
  { value: "activity", label: "🎯 Activity", hint: "Excursion, sightseeing, tour" },
  { value: "travel", label: "✈️ Travel", hint: "Flight, transfer, train" },
  { value: "meal", label: "🍽️ Meal", hint: "Restaurant, dining" },
  { value: "free_day", label: "🌴 Free Day", hint: "Nothing scheduled" },
];

export default function AddSegmentForm({
  dayId,
  dayDate,
  onSaved,
  onCancel,
}: AddSegmentFormProps) {
  const datetimeBounds = computeDatetimeBounds(dayDate);
  const [type, setType] = useState<SegmentType>("activity");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [instructions, setInstructions] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [referenceLabel, setReferenceLabel] = useState("");

  // Travel-only: multi-leg list
  const [legs, setLegs] = useState<TravelLegDraft[]>([{ ...EMPTY_LEG }]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (type === "travel") {
      if (legs.length === 0) {
        setError("Travel segments need at least one leg");
        return;
      }
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        if (leg.departureAt && leg.arrivalAt) {
          if (new Date(leg.departureAt) >= new Date(leg.arrivalAt)) {
            setError(`Leg ${i + 1}: arrival must be after departure`);
            return;
          }
        }
      }
    } else {
      if (startTime && endTime && startTime >= endTime) {
        setError("End time must be after start time");
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      type,
      title: title.trim(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      instructions: instructions.trim() || undefined,
      confirmation: confirmation.trim() || undefined,
      referenceType: referenceType || undefined,
      referenceLabel: referenceType === "other" ? (referenceLabel.trim() || undefined) : undefined,
    };

    // Travel legs are created after the segment is saved — see below.

    const res = await fetch(`/api/days/${dayId}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.error?.message || data.error || "Failed to save");
      setIsSaving(false);
      return;
    }

    // For travel segments, create each leg now that we have the segment ID.
    if (type === "travel" && data.segment?.id) {
      for (const leg of legs) {
        const legBody = {
          travelMode: leg.travelMode,
          origin: leg.origin.trim() || undefined,
          destination: leg.destination.trim() || undefined,
          departureAt: leg.departureAt || undefined,
          arrivalAt: leg.arrivalAt || undefined,
          originTimezone: leg.originTimezone || undefined,
          destinationTimezone: leg.destinationTimezone || undefined,
          operator: leg.operator.trim() || undefined,
          identifier: leg.identifier.trim() || undefined,
          reference: leg.reference.trim() || undefined,
        };
        const legRes = await fetch(`/api/segments/${data.segment.id}/legs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(legBody),
        });
        if (!legRes.ok) {
          setError(`Leg save failed`);
          setIsSaving(false);
          return;
        }
      }
    }

    onSaved();
    setIsSaving(false);
  }

  return (
    <Card className="mb-2 bg-gray-50">
      <h4 className="font-semibold text-sm mb-3">New Segment</h4>
      <div className="space-y-3">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <p className="text-xs text-gray-500 mb-2">
            A segment is one thing happening at a specific time — a museum visit, a flight, dinner, or a free block of time.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEGMENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value as SegmentType)}
                className={`p-2 rounded-lg text-sm text-left transition-colors ${
                  type === opt.value
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-primary"
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div
                  className={`text-xs ${
                    type === opt.value ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === "travel"
              ? "Air Canada AC0009 to Tokyo"
              : type === "meal"
              ? "Dinner at hotel restaurant"
              : "Tokyo Skytree visit"
          }
          helperText="Short and descriptive"
          autoFocus
        />

        {/* Travel-specific fields — repeatable leg list */}
        {type === "travel" ? (
          <>
            <div className="space-y-3">
              {legs.map((leg, idx) => (
                <TravelLegFields
                  key={idx}
                  leg={leg}
                  index={idx + 1}
                  onChange={(patch) => {
                    const next = [...legs];
                    next[idx] = { ...next[idx], ...patch };
                    setLegs(next);
                  }}
                  onRemove={() => {
                    setLegs(legs.filter((_, i) => i !== idx));
                  }}
                  canRemove={legs.length > 1}
                />
              ))}
              <button
                type="button"
                onClick={() => setLegs([...legs, { ...EMPTY_LEG }])}
                className="w-full py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary"
              >
                + Add another leg
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                step={60}
                onClick={openPickerOnClick}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                helperText="e.g., 14:00"
                className="cursor-pointer"
              />
              <Input
                label="End Time"
                type="time"
                step={60}
                onClick={openPickerOnClick}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                helperText="e.g., 16:30"
                className="cursor-pointer"
              />
            </div>
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sumida, Tokyo"
              helperText="Where it happens"
            />
          </>
        )}

        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Meet at hotel lobby 15 min early. Bring passport."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Details the client needs to know
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference Type (optional)
          </label>
          <select
            value={referenceType}
            onChange={(e) => setReferenceType(e.target.value)}
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

        {referenceType === "other" && (
          <Input
            label="Custom Label"
            value={referenceLabel}
            onChange={(e) => setReferenceLabel(e.target.value)}
            placeholder="Ticket Number"
            helperText="What should the client see before the value?"
          />
        )}

        {referenceType !== "" && (
          <Input
            label="Reference Value"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="COPNYP"
            helperText="The booking reference / code itself"
          />
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Saving..." : "Add Segment"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
