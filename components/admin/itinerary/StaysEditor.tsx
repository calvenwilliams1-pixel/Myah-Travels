"use client";

import React, { useState } from "react";
import AutocompleteField from "@/components/ui/AutocompleteField";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";
import AutosaveDateField from "@/components/ui/autosave/AutosaveDateField";
import AutosaveTimeField from "@/components/ui/autosave/AutosaveTimeField";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AutosaveSelectField from "@/components/ui/autosave/AutosaveSelectField";
import { portLineFromTitle } from "@/lib/itineraries/sailingTitles";
import { daysBetweenISODate } from "@/lib/itineraries/dates";
import type { Stay } from "./ItineraryEditor";

interface StaysEditorProps {
  sectionId: number;
  stays: Stay[];
  days: Array<{ date: string; title: string | null }>;
  onChanged: () => void;
}

const KIND_OPTIONS = [
  { value: "hotel", label: "🏨 Hotel" },
  { value: "resort", label: "🏝️ Resort" },
  { value: "cruise", label: "🚢 Cruise" },
];

const MEAL_PLAN_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "All-inclusive", label: "All-inclusive" },
  { value: "Full board", label: "Full board" },
  { value: "Half board", label: "Half board" },
  { value: "Breakfast included", label: "Breakfast included" },
  { value: "Room only", label: "Room only" },
];

export default function StaysEditor({
  sectionId,
  stays,
  days,
  onChanged,
}: StaysEditorProps) {
  if (stays.length === 0) {
    return (
      <p className="text-xs text-gray-400 pl-2">
        No stays added yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {stays.map((stay) => (
        <StayRow
          key={stay.id}
          sectionId={sectionId}
          stay={stay}
          days={days}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

function StayRow({
  sectionId,
  stay,
  days,
  onChanged,
}: {
  sectionId: number;
  stay: Stay;
  days: Array<{ date: string; title: string | null }>;
  onChanged: () => void;
}) {
  const kind = stay.kind || "hotel";
  const isCruise = kind === "cruise";
  const isResort = kind === "resort";
  const [transfers, setTransfers] = useState<boolean>(stay.transfersIncluded ?? false);

  async function update(data: Partial<Stay>) {
    await fetch(`/api/stays/${stay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function remove() {
    if (!confirm("Delete this stay?")) return;
    await fetch(`/api/stays/${stay.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {isCruise ? (
            <AutocompleteField
              value={stay.hotelName}
              onSave={(v) => update({ hotelName: v })}
              draftKey={`stay:${stay.id}:shipName`}
              placeholder="Ship name"
              fieldKey={FIELD_KEYS.STAY_SHIP}
              onEntityAccept={(payload) => {
                if (payload.line) void update({ cruiseLine: payload.line });
              }}
            />
          ) : (
            <AutocompleteField
              value={stay.hotelName}
              onSave={(v) => update({ hotelName: v })}
              draftKey={`stay:${stay.id}:hotelName`}
              placeholder={isResort ? "Resort name" : "Hotel name"}
              fieldKey={FIELD_KEYS.STAY_HOTEL_NAME}
              entityKind="hotel"
            />
          )}
        </div>
        <button
          onClick={remove}
          className="text-red-500 hover:text-red-700 text-sm px-2"
          aria-label="Delete stay"
        >
          ✕
        </button>
      </div>

      <AutosaveSelectField
        label="Stay Type"
        value={kind}
        options={KIND_OPTIONS}
        onSave={async (v) => {
          await update({ kind: v });
          onChanged();
        }}
        draftKey={`stay:${stay.id}:kind`}
      />

      {isCruise && (
        <>
          <AutocompleteField
            label="Cruise Line"
            value={stay.cruiseLine || ""}
            onSave={(v) => update({ cruiseLine: v })}
            draftKey={`stay:${stay.id}:cruiseLine`}
            placeholder="Royal Caribbean International"
            fieldKey={FIELD_KEYS.STAY_CRUISE_LINE}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AutosaveTextField
              label="Cabin"
              value={stay.cabin || ""}
              onSave={(v) => update({ cabin: v })}
              draftKey={`stay:${stay.id}:cabin`}
              placeholder="8254"
            />
            <AutosaveTextField
              label="Deck"
              value={stay.deck || ""}
              onSave={(v) => update({ deck: v })}
              draftKey={`stay:${stay.id}:deck`}
              placeholder="8"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AutosaveTextField
              label="Embarkation Port"
              value={stay.embarkPort || ""}
              onSave={(v) => update({ embarkPort: v })}
              draftKey={`stay:${stay.id}:embarkPort`}
              placeholder="Miami, Florida"
            />
            <AutosaveTextField
              label="Disembarkation Port"
              value={stay.disembarkPort || ""}
              onSave={(v) => update({ disembarkPort: v })}
              draftKey={`stay:${stay.id}:disembarkPort`}
              placeholder="Miami, Florida"
            />
          </div>
        </>
      )}

      {isResort && (
        <>
          <AutocompleteField
            label="Resort Brand"
            value={stay.resortBrand || ""}
            onSave={(v) => update({ resortBrand: v })}
            draftKey={`stay:${stay.id}:resortBrand`}
            placeholder="Sandals Resorts"
            fieldKey={FIELD_KEYS.STAY_RESORT_BRAND}
          />
          <AutosaveSelectField
            label="Meal Plan"
            value={stay.mealPlan || ""}
            options={MEAL_PLAN_OPTIONS}
            onSave={(v) => update({ mealPlan: v })}
            draftKey={`stay:${stay.id}:mealPlan`}
          />
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={transfers}
                onChange={(e) => {
                  setTransfers(e.target.checked);
                  void update({ transfersIncluded: e.target.checked });
                }}
              />
              Airport transfers included
            </label>
            {transfers && (
              <div className="mt-2">
                <AutosaveTextField
                  label="Transfer Details"
                  value={stay.transfersNote || ""}
                  onSave={(v) => update({ transfersNote: v })}
                  draftKey={`stay:${stay.id}:transfersNote`}
                  placeholder="Shared shuttle, meet at arrivals"
                />
              </div>
            )}
          </div>
        </>
      )}

      {!isCruise && (
        <AutocompleteField
          label="Address"
          value={stay.address || ""}
          onSave={(v) => update({ address: v })}
          draftKey={`stay:${stay.id}:address`}
          placeholder="Full address"
          helperText="Useful for taxi drivers"
          fieldKey={FIELD_KEYS.STAY_ADDRESS}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AutosaveDateField
          label={isCruise ? "Embark" : "Check-in"}
          value={stay.checkInDate}
          onSave={(v) => update({ checkInDate: v })}
          draftKey={`stay:${stay.id}:checkInDate`}
        />
        <AutosaveDateField
          label={isCruise ? "Disembark" : "Check-out"}
          value={stay.checkOutDate}
          onSave={(v) => update({ checkOutDate: v })}
          draftKey={`stay:${stay.id}:checkOutDate`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AutosaveTimeField
          label={isCruise ? "Boarding Time" : "Check-in Time"}
          value={stay.checkInTime || ""}
          onSave={(v) => update({ checkInTime: v })}
          draftKey={`stay:${stay.id}:checkInTime`}
          helperText="e.g., 15:00"
        />
        <AutosaveTimeField
          label={isCruise ? "Disembark Time" : "Check-out Time"}
          value={stay.checkOutTime || ""}
          onSave={(v) => update({ checkOutTime: v })}
          draftKey={`stay:${stay.id}:checkOutTime`}
          helperText="e.g., 11:00"
        />
      </div>

      {isCruise && (
        <SailingDaysPanel
          sectionId={sectionId}
          stay={stay}
          days={days}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function SailingDaysPanel({
  sectionId,
  stay,
  days,
  onChanged,
}: {
  sectionId: number;
  stay: Stay;
  days: Array<{ date: string; title: string | null }>;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nights = daysBetweenISODate(stay.checkInDate, stay.checkOutDate) ?? 0;
  const expected = nights + 1;

  function prefill(): string {
    // A port list parsed from the booking confirmation wins — it is
    // the list exactly as the cruise line printed it.
    if (stay.portsList && stay.portsList.trim()) return stay.portsList;
    const inRange = days
      .filter((d) => d.date >= stay.checkInDate && d.date <= stay.checkOutDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (inRange.length > 0) {
      return inRange.map((d) => portLineFromTitle(d.title)).join("\n");
    }
    const lines = Array.from({ length: expected }, () => "");
    if (stay.embarkPort) lines[0] = stay.embarkPort;
    if (stay.disembarkPort && expected > 1) lines[expected - 1] = stay.disembarkPort;
    return lines.join("\n");
  }

  async function run() {
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/sections/${sectionId}/sailing-days`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stayId: stay.id, ports: text.split("\n") }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.success) {
      setMsg(
        `Laid out: ${data.created} new day${data.created === 1 ? "" : "s"}, ${data.retitled} retitled. Anything you already added to those days was left alone.`
      );
      onChanged();
    } else {
      setError(data.error || "Could not lay out the sailing days");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setText(prefill());
          setOpen(true);
        }}
        className="text-xs px-2 py-1 bg-primary text-white rounded hover:opacity-90"
      >
        🚢 Lay out sailing days
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
      <p className="text-xs text-gray-600">
        One port per line, in sailing order — <strong>{expected} lines</strong> for this{" "}
        {nights}-night sailing, embark day first and disembark day last. Write{" "}
        <em>At sea</em> for sea days. Re-running rebuilds the day titles only; segments
        you have added stay put.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(expected + 1, 12)}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono"
        placeholder={"Miami, Florida\nAt sea\nNassau, Bahamas\n…"}
      />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      {msg && <p className="text-green-700 text-xs">{msg}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs px-2 py-1 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
        >
          Close
        </button>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="text-xs px-2 py-1 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Laying out..." : "Lay out the days"}
        </button>
      </div>
    </div>
  );
}
