"use client";

import { openPickerOnClick } from "@/lib/ui/openPicker";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddStayFormProps {
  sectionId: number;
  sectionStartDate: string | null;
  sectionEndDate: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddStayForm({
  sectionId,
  sectionStartDate,
  sectionEndDate,
  onSaved,
  onCancel,
}: AddStayFormProps) {
  const [hotelName, setHotelName] = useState("");
  const [address, setAddress] = useState("");
  const [checkInDate, setCheckInDate] = useState(sectionStartDate || "");
  const [checkOutDate, setCheckOutDate] = useState(sectionEndDate || "");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useSectionDates() {
    if (sectionStartDate) setCheckInDate(sectionStartDate);
    if (sectionEndDate) setCheckOutDate(sectionEndDate);
  }

  async function handleSave() {
    if (!hotelName.trim()) {
      setError("Hotel name is required");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError("Check-in and check-out dates are required");
      return;
    }
    if (checkInDate >= checkOutDate) {
      setError("Check-out must be after check-in");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/sections/${sectionId}/stays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelName: hotelName.trim(),
        address: address.trim() || undefined,
        checkInDate,
        checkOutDate,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
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
      <h4 className="font-semibold text-sm mb-3">New Stay</h4>
      <div className="space-y-3">
        <Input
          label="Hotel Name"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          placeholder="The Yokohama Bay Hotel Tokyu"
          helperText="Full hotel name as it appears on the booking"
          autoFocus
        />

        <Input
          label="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="2 Chome-3-7 Minatomirai, Nishi Ward, Yokohama"
          helperText="Useful for taxi drivers and navigation"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Check-in Date"
            type="date"
            onClick={openPickerOnClick}

            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            min={sectionStartDate || undefined}
            max={sectionEndDate || undefined}
            className="cursor-pointer"
          />
          <Input
            label="Check-out Date"
            type="date"
            onClick={openPickerOnClick}

            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            min={sectionStartDate || undefined}
            max={sectionEndDate || undefined}
            className="cursor-pointer"
          />
        </div>

        {sectionStartDate && sectionEndDate && (
          <button
            type="button"
            onClick={useSectionDates}
            className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Use section dates ({sectionStartDate} → {sectionEndDate})
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Check-in Time (optional)"
            type="time"
            onClick={openPickerOnClick}

            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            helperText="e.g., 15:00"
            className="cursor-pointer"
          />
          <Input
            label="Check-out Time (optional)"
            type="time"
            onClick={openPickerOnClick}

            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            helperText="e.g., 11:00"
            className="cursor-pointer"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Add Stay"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
