"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddSegmentFormProps {
  dayId: number;
  onSaved: () => void;
  onCancel: () => void;
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
  onSaved,
  onCancel,
}: AddSegmentFormProps) {
  const [type, setType] = useState<SegmentType>("activity");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [instructions, setInstructions] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Travel-only fields
  const [departureAirport, setDepartureAirport] = useState("");
  const [arrivalAirport, setArrivalAirport] = useState("");
  const [departureDatetime, setDepartureDatetime] = useState("");
  const [arrivalDatetime, setArrivalDatetime] = useState("");
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (type === "travel") {
      if (departureDatetime && arrivalDatetime) {
        if (new Date(departureDatetime) >= new Date(arrivalDatetime)) {
          setError("Arrival must be after departure");
          return;
        }
      }
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
    };

    if (type === "travel") {
      body.departureAirport = departureAirport.trim() || undefined;
      body.arrivalAirport = arrivalAirport.trim() || undefined;
      body.departureDatetime = departureDatetime || undefined;
      body.arrivalDatetime = arrivalDatetime || undefined;
      body.airline = airline.trim() || undefined;
      body.flightNumber = flightNumber.trim() || undefined;
    }

    const res = await fetch(`/api/days/${dayId}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      onSaved();
    } else {
      setError(data.error?.message || data.error || "Failed to save");
    }

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

        {/* Travel-specific fields */}
        {type === "travel" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                value={departureAirport}
                onChange={(e) => setDepartureAirport(e.target.value)}
                placeholder="YYZ"
                helperText="Airport code"
              />
              <Input
                label="To"
                value={arrivalAirport}
                onChange={(e) => setArrivalAirport(e.target.value)}
                placeholder="NRT"
                helperText="Airport code"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Departure"
                type="datetime-local"
                value={departureDatetime}
                onChange={(e) => setDepartureDatetime(e.target.value)}
                helperText="Local time at departure"
                className="cursor-pointer"
              />
              <Input
                label="Arrival"
                type="datetime-local"
                value={arrivalDatetime}
                onChange={(e) => setArrivalDatetime(e.target.value)}
                helperText="Local time at arrival"
                className="cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Airline"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                placeholder="Air Canada"
              />
              <Input
                label="Flight #"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="AC0009"
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                helperText="e.g., 14:00"
                className="cursor-pointer"
              />
              <Input
                label="End Time"
                type="time"
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

        <Input
          label="Confirmation (optional)"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="COPNYP"
          helperText="Booking reference"
        />

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
