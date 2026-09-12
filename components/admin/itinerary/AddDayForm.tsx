"use client";

import { openPickerOnClick } from "@/lib/ui/openPicker";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddDayFormProps {
  sectionId: number;
  nextDayNumber: number;
  sectionStartDate: string | null;
  sectionEndDate: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddDayForm({
  sectionId,
  nextDayNumber,
  sectionStartDate,
  sectionEndDate,
  onSaved,
  onCancel,
}: AddDayFormProps) {
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!date) {
      setError("Date is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/sections/${sectionId}/days`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        dayNumber: nextDayNumber,
        title: title.trim() || undefined,
      }),
    });

    const data = await res.json();

    if (data.success) {
      onSaved();
    } else {
      setError(data.error || "Failed to save");
    }

    setIsSaving(false);
  }

  return (
    <Card className="mb-3 bg-gray-50">
      <h4 className="font-semibold text-sm mb-3">New Day</h4>
      <div className="space-y-3">
        <Input
          label="Date"
          type="date"
            onClick={openPickerOnClick}

          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={sectionStartDate || undefined}
          max={sectionEndDate || undefined}
          helperText={
            sectionStartDate && sectionEndDate
              ? `Between ${sectionStartDate} and ${sectionEndDate}`
              : "YYYY-MM-DD"
          }
          className="cursor-pointer"
          autoFocus
        />

        <Input
          label="Day Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Arrival & Transfer"
          helperText="A short nickname for this day (e.g., 'Arrival Day', 'Cruise Day', 'Museum Day'). The details of each activity go into Segments."
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !date}>
            {isSaving ? "Saving..." : "Add Day"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
