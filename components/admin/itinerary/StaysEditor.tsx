"use client";

import React, { useState } from "react";
import AutocompleteField from "@/components/ui/AutocompleteField";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";
import AutosaveDateField from "@/components/ui/autosave/AutosaveDateField";
import AutosaveTimeField from "@/components/ui/autosave/AutosaveTimeField";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AutosaveSelectField from "@/components/ui/autosave/AutosaveSelectField";
import type { Stay } from "./ItineraryEditor";

interface StaysEditorProps {
  sectionId: number;
  stays: Stay[];
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
        <StayRow key={stay.id} stay={stay} onChanged={onChanged} />
      ))}
    </div>
  );
}

function StayRow({
  stay,
  onChanged,
}: {
  stay: Stay;
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
    </div>
  );
}
