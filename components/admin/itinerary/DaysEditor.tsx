"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AddSegmentForm from "./AddSegmentForm";
import SegmentsEditor from "./SegmentsEditor";
import type { Day } from "./ItineraryEditor";

interface DaysEditorProps {
  sectionId: number;
  days: Day[];
  onChanged: () => void;
}

export default function DaysEditor({
  sectionId,
  days,
  onChanged,
}: DaysEditorProps) {
  if (days.length === 0) {
    return (
      <p className="text-xs text-gray-400 pl-2">
        No days added yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <DayRow key={day.id} day={day} onChanged={onChanged} />
      ))}
    </div>
  );
}

function DayRow({
  day,
  onChanged,
}: {
  day: Day;
  onChanged: () => void;
}) {
  const [showAddSegment, setShowAddSegment] = useState(false);

  async function update(data: Partial<Day>) {
    await fetch(`/api/days/${day.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function remove() {
    if (!confirm("Delete this day and all its segments?")) return;
    await fetch(`/api/days/${day.id}`, { method: "DELETE" });
    onChanged();
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="border-l-2 border-gray-200 pl-3 space-y-2">
      {/* Day header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Day {day.dayNumber}
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {formatDate(day.date)}
        </span>
        <div className="flex-1 min-w-[200px]">
          <AutosaveTextField
            value={day.title || ""}
            onSave={(v) => update({ title: v })}
            draftKey={`day:${day.id}:title`}
            placeholder="Day title (optional) — e.g., Arrival Day"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddSegment(!showAddSegment)}
        >
          {showAddSegment ? "Cancel" : "+ Segment"}
        </Button>
        <button
          onClick={remove}
          className="text-red-500 hover:text-red-700 text-sm"
          aria-label="Delete day"
        >
          ✕
        </button>
      </div>

      {/* Add segment form */}
      {showAddSegment && (
        <AddSegmentForm
          dayId={day.id}
          dayDate={day.date}
          onSaved={() => {
            setShowAddSegment(false);
            onChanged();
          }}
          onCancel={() => setShowAddSegment(false)}
        />
      )}

      {/* Segments list */}
      <SegmentsEditor
        dayId={day.id}
        segments={day.segments}
        onChanged={onChanged}
      />
    </div>
  );
}
