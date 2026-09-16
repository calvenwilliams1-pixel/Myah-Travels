"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";
import BookingParseForm from "./BookingParseForm";
import { TIMEZONE_GROUPS } from "@/lib/itineraries/timezones";

export type TravelMode = "flight" | "train" | "bus" | "transfer" | "other";

export interface TravelLegDraft {
  travelMode: TravelMode;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  originTimezone: string;
  destinationTimezone: string;
  operator: string;
  identifier: string;
  reference: string;
}

export const EMPTY_LEG: TravelLegDraft = {
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
};

const MODE_OPTIONS: Array<{ value: TravelMode; label: string; hint: string }> = [
  { value: "flight", label: "✈️ Flight", hint: "Airline, airports" },
  { value: "train", label: "🚆 Train", hint: "Rail, stations" },
  { value: "bus", label: "🚌 Bus", hint: "Coach, stops" },
  { value: "transfer", label: "🚐 Transfer", hint: "Van, taxi, walk" },
  { value: "other", label: "📍 Other", hint: "Anything else" },
];

interface TravelLegFieldsProps {
  leg: TravelLegDraft;
  onChange: (patch: Partial<TravelLegDraft>) => void;
  index?: number; // 1-based display number
  onRemove?: () => void;
  canRemove?: boolean;
}

function modeLabels(mode: TravelMode) {
  switch (mode) {
    case "flight":
      return { origin: "From (airport code)", destination: "To (airport code)", originPh: "YYZ", destPh: "NRT", operator: "Airline", identifier: "Flight #", identifierPh: "AC0009" };
    case "train":
      return { origin: "From (station)", destination: "To (station)", originPh: "Tokyo Station", destPh: "Kyoto Station", operator: "Operator", identifier: "Train #", identifierPh: "" };
    case "bus":
      return { origin: "From (stop)", destination: "To (stop)", originPh: "Bencoolen", destPh: "Changi T2", operator: "Bus company", identifier: "Bus #", identifierPh: "" };
    case "transfer":
      return { origin: "From", destination: "To", originPh: "Hotel lobby", destPh: "Airport T1", operator: "Operator (optional)", identifier: "Vehicle / route", identifierPh: "" };
    case "other":
      return { origin: "From", destination: "To", originPh: "", destPh: "", operator: "Operator", identifier: "Identifier", identifierPh: "" };
  }
}

export default function TravelLegFields({
  leg,
  onChange,
  index,
  onRemove,
  canRemove,
}: TravelLegFieldsProps) {
  const labels = modeLabels(leg.travelMode);
  const [showParse, setShowParse] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {index ? `Leg ${index}` : "Leg"}
        </p>
        {leg.travelMode === "flight" && (
          <button
            type="button"
            onClick={() => setShowParse(!showParse)}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Paste a flight confirmation to prefill fields"
          >
            {showParse ? "Cancel paste" : "Paste booking"}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className={`text-xs ${canRemove ? "text-red-500 hover:text-red-700" : "text-gray-300 cursor-not-allowed"}`}
            title={canRemove ? "Remove leg" : "Cannot remove the last leg"}
          >
            ✕ Remove
          </button>
        )}
      </div>

      {showParse && (
        <BookingParseForm
          onApply={(booking) => {
            const patch: Partial<TravelLegDraft> = {};
            if (booking.airline) patch.operator = booking.airline;
            if (booking.flightNumber) patch.identifier = booking.flightNumber;
            if (booking.origin) patch.origin = booking.origin;
            if (booking.destination) patch.destination = booking.destination;
            if (booking.reference) patch.reference = booking.reference;
            if (booking.departureAt) patch.departureAt = booking.departureAt;
            if (booking.arrivalAt) patch.arrivalAt = booking.arrivalAt;
            onChange(patch);
          }}
          onClose={() => setShowParse(false)}
        />
      )}

      {/* Mode selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <div className="grid grid-cols-5 gap-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ travelMode: opt.value })}
              className={`p-1.5 rounded text-xs transition-colors ${
                leg.travelMode === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-2 gap-2">
        <AutocompleteInput
          label={labels.origin}
          value={leg.origin}
          onChange={(v) => onChange({ origin: v })}
          placeholder={labels.originPh}
          fieldKey={FIELD_KEYS.LEG_ORIGIN}
        />
        <AutocompleteInput
          label={labels.destination}
          value={leg.destination}
          onChange={(v) => onChange({ destination: v })}
          placeholder={labels.destPh}
          fieldKey={FIELD_KEYS.LEG_DESTINATION}
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Departure"
          type="datetime-local"
          step={60}
          value={leg.departureAt}
          onChange={(e) => onChange({ departureAt: e.target.value })}
        />
        <Input
          label="Arrival"
          type="datetime-local"
          step={60}
          value={leg.arrivalAt}
          onChange={(e) => onChange({ arrivalAt: e.target.value })}
        />
      </div>

      {/* Timezones (cosmetic only) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Departure Timezone (optional)</label>
          <select
            value={leg.originTimezone}
            onChange={(e) => onChange({ originTimezone: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="">— None —</option>
            {TIMEZONE_GROUPS.map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Arrival Timezone (optional)</label>
          <select
            value={leg.destinationTimezone}
            onChange={(e) => onChange({ destinationTimezone: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="">— None —</option>
            {TIMEZONE_GROUPS.map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Operator / Identifier */}
      <div className="grid grid-cols-2 gap-2">
        <AutocompleteInput
          label={labels.operator}
          value={leg.operator}
          onChange={(v) => onChange({ operator: v })}
          fieldKey={FIELD_KEYS.LEG_OPERATOR}
        />
        <AutocompleteInput
          label={labels.identifier}
          value={leg.identifier}
          onChange={(v) => onChange({ identifier: v })}
          placeholder={labels.identifierPh}
          fieldKey={FIELD_KEYS.LEG_IDENTIFIER}
        />
      </div>

      {/* Reference */}
      <Input
        label="Reference (optional)"
        value={leg.reference}
        onChange={(e) => onChange({ reference: e.target.value })}
        placeholder="COPNYP"
        helperText="Per-leg confirmation code"
      />
    </div>
  );
}
