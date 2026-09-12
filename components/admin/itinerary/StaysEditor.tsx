"use client";

import React from "react";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AutosaveDateField from "@/components/ui/autosave/AutosaveDateField";
import AutosaveTimeField from "@/components/ui/autosave/AutosaveTimeField";
import type { Stay } from "./ItineraryEditor";

interface StaysEditorProps {
  sectionId: number;
  stays: Stay[];
  onChanged: () => void;
}

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
          <AutosaveTextField
            value={stay.hotelName}
            onSave={(v) => update({ hotelName: v })}
            draftKey={`stay:${stay.id}:hotelName`}
            placeholder="Hotel name"
          />
        </div>
        <button
          onClick={remove}
          className="text-red-500 hover:text-red-700 text-sm px-2"
          aria-label="Delete stay"
        >
          ✕
        </button>
      </div>

      <AutosaveTextField
        label="Address"
        value={stay.address || ""}
        onSave={(v) => update({ address: v })}
        draftKey={`stay:${stay.id}:address`}
        placeholder="Full address"
        helperText="Useful for taxi drivers"
      />

      <div className="grid grid-cols-2 gap-3">
        <AutosaveDateField
          label="Check-in"
          value={stay.checkInDate}
          onSave={(v) => update({ checkInDate: v })}
          draftKey={`stay:${stay.id}:checkInDate`}
        />
        <AutosaveDateField
          label="Check-out"
          value={stay.checkOutDate}
          onSave={(v) => update({ checkOutDate: v })}
          draftKey={`stay:${stay.id}:checkOutDate`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AutosaveTimeField
          label="Check-in Time"
          value={stay.checkInTime || ""}
          onSave={(v) => update({ checkInTime: v })}
          draftKey={`stay:${stay.id}:checkInTime`}
          helperText="e.g., 15:00"
        />
        <AutosaveTimeField
          label="Check-out Time"
          value={stay.checkOutTime || ""}
          onSave={(v) => update({ checkOutTime: v })}
          draftKey={`stay:${stay.id}:checkOutTime`}
          helperText="e.g., 11:00"
        />
      </div>
    </div>
  );
}
