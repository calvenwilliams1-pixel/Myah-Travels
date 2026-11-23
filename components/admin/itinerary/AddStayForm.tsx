"use client";

import { openPickerOnClick } from "@/lib/ui/openPicker";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";

interface AddStayFormProps {
  sectionId: number;
  sectionStartDate: string | null;
  sectionEndDate: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

type StayKind = "hotel" | "resort" | "cruise";

const KIND_OPTIONS: Array<{ value: StayKind; label: string }> = [
  { value: "hotel", label: "🏨 Hotel" },
  { value: "resort", label: "🏝️ Resort" },
  { value: "cruise", label: "🚢 Cruise" },
];

const MEAL_PLANS = ["All-inclusive", "Full board", "Half board", "Breakfast included", "Room only"];

export default function AddStayForm({
  sectionId,
  sectionStartDate,
  sectionEndDate,
  onSaved,
  onCancel,
}: AddStayFormProps) {
  const [kind, setKind] = useState<StayKind>("hotel");
  const [hotelName, setHotelName] = useState("");
  const [address, setAddress] = useState("");
  const [checkInDate, setCheckInDate] = useState(sectionStartDate || "");
  const [checkOutDate, setCheckOutDate] = useState(sectionEndDate || "");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  // Cruise
  const [cruiseLine, setCruiseLine] = useState("");
  const [cabin, setCabin] = useState("");
  const [deck, setDeck] = useState("");
  const [embarkPort, setEmbarkPort] = useState("");
  const [disembarkPort, setDisembarkPort] = useState("");
  // Resort
  const [resortBrand, setResortBrand] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [transfersIncluded, setTransfersIncluded] = useState(false);
  const [transfersNote, setTransfersNote] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCruise = kind === "cruise";
  const isResort = kind === "resort";
  const inLabel = isCruise ? "Embark" : "Check-in";
  const outLabel = isCruise ? "Disembark" : "Check-out";

  function useSectionDates() {
    if (sectionStartDate) setCheckInDate(sectionStartDate);
    if (sectionEndDate) setCheckOutDate(sectionEndDate);
  }

  async function handleSave() {
    if (!hotelName.trim()) {
      setError(isCruise ? "Ship is required — pick one from the list" : "Name is required");
      return;
    }
    if (isCruise && !cruiseLine.trim()) {
      setError("Cruise line is required — picking the ship usually fills it in");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError(`${inLabel} and ${outLabel.toLowerCase()} dates are required`);
      return;
    }
    if (checkInDate >= checkOutDate) {
      setError(`${outLabel} must be after ${inLabel.toLowerCase()}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/sections/${sectionId}/stays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelName: hotelName.trim(),
        address: !isCruise ? address.trim() || undefined : undefined,
        checkInDate,
        checkOutDate,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        kind,
        cruiseLine: isCruise ? cruiseLine.trim() || undefined : undefined,
        cabin: isCruise ? cabin.trim() || undefined : undefined,
        deck: isCruise ? deck.trim() || undefined : undefined,
        embarkPort: isCruise ? embarkPort.trim() || undefined : undefined,
        disembarkPort: isCruise ? disembarkPort.trim() || undefined : undefined,
        resortBrand: isResort ? resortBrand.trim() || undefined : undefined,
        mealPlan: isResort ? mealPlan || undefined : undefined,
        transfersIncluded: isResort ? transfersIncluded : undefined,
        transfersNote: isResort && transfersIncluded ? transfersNote.trim() || undefined : undefined,
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
        {/* Kind selector — the form only asks what the kind needs */}
        <div className="grid grid-cols-3 gap-1">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className={`p-1.5 rounded text-xs transition-colors ${
                kind === opt.value
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isCruise && (
          <AutocompleteInput
            label="Cruise Line"
            value={cruiseLine}
            onChange={setCruiseLine}
            placeholder="Royal Caribbean International"
            helperText="Pick from the list — ships below are grouped by line"
            fieldKey={FIELD_KEYS.STAY_CRUISE_LINE}
            autoFocus
          />
        )}

        {isCruise ? (
          <AutocompleteInput
            label="Ship"
            value={hotelName}
            onChange={setHotelName}
            placeholder="Icon of the Seas"
            helperText="Picking the ship fills in the cruise line"
            fieldKey={FIELD_KEYS.STAY_SHIP}
            onEntityAccept={(payload) => {
              if (payload.line) setCruiseLine(payload.line);
            }}
          />
        ) : (
          <AutocompleteInput
            label={isResort ? "Resort Name" : "Hotel Name"}
            value={hotelName}
            onChange={setHotelName}
            placeholder={isResort ? "Sandals Royal Barbados" : "The Yokohama Bay Hotel Tokyu"}
            helperText="Full name as it appears on the booking"
            fieldKey={FIELD_KEYS.STAY_HOTEL_NAME}
            entityKind="hotel"
            autoFocus={!isCruise}
            onEntityAccept={(payload) => {
              if (payload.address && !address.trim()) setAddress(payload.address);
              if (payload.check_in_time && !checkInTime) setCheckInTime(payload.check_in_time);
              if (payload.check_out_time && !checkOutTime) setCheckOutTime(payload.check_out_time);
            }}
          />
        )}

        {isResort && (
          <>
            <AutocompleteInput
              label="Resort Brand (optional)"
              value={resortBrand}
              onChange={setResortBrand}
              placeholder="Sandals Resorts"
              fieldKey={FIELD_KEYS.STAY_RESORT_BRAND}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Plan</label>
                <select
                  value={mealPlan}
                  onChange={(e) => setMealPlan(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  <option value="">— Select —</option>
                  {MEAL_PLANS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfers</label>
                <label className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                  <input
                    type="checkbox"
                    checked={transfersIncluded}
                    onChange={(e) => setTransfersIncluded(e.target.checked)}
                  />
                  Airport transfers included
                </label>
              </div>
            </div>
            {transfersIncluded && (
              <Input
                label="Transfer Details (optional)"
                value={transfersNote}
                onChange={(e) => setTransfersNote(e.target.value)}
                placeholder="Shared shuttle, meet at arrivals with name board"
              />
            )}
          </>
        )}

        {isCruise && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cabin (optional)"
                value={cabin}
                onChange={(e) => setCabin(e.target.value)}
                placeholder="8254"
              />
              <Input
                label="Deck (optional)"
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
                placeholder="8"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Embarkation Port"
                value={embarkPort}
                onChange={(e) => setEmbarkPort(e.target.value)}
                placeholder="Miami, Florida"
              />
              <Input
                label="Disembarkation Port"
                value={disembarkPort}
                onChange={(e) => setDisembarkPort(e.target.value)}
                placeholder="Miami, Florida"
              />
            </div>
          </>
        )}

        {!isCruise && (
          <AutocompleteInput
            label="Address (optional)"
            value={address}
            onChange={setAddress}
            placeholder="2 Chome-3-7 Minatomirai, Nishi Ward, Yokohama"
            helperText="Useful for taxi drivers and navigation"
            fieldKey={FIELD_KEYS.STAY_ADDRESS}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`${inLabel} Date`}
            type="date"
            onClick={openPickerOnClick}
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            min={sectionStartDate || undefined}
            max={sectionEndDate || undefined}
            className="cursor-pointer"
          />
          <Input
            label={`${outLabel} Date`}
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
            label={isCruise ? "Boarding Time (optional)" : "Check-in Time (optional)"}
            type="time"
            step={60}
            onClick={openPickerOnClick}
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            helperText="e.g., 15:00"
            className="cursor-pointer"
          />
          <Input
            label={isCruise ? "Disembark Time (optional)" : "Check-out Time (optional)"}
            type="time"
            step={60}
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
