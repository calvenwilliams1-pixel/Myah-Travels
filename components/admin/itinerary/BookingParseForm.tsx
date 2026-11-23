"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { parseBooking, type ParsedBooking } from "@/lib/suggestions/parseBooking";

interface BookingParseFormProps {
  onApply: (booking: ParsedBooking) => void;
  onClose: () => void;
}

export default function BookingParseForm({ onApply, onClose }: BookingParseFormProps) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseBooking> | null>(null);

  async function handleParse() {
    const result = parseBooking(raw);
    // Fill the legs' timezones from the airport catalog so a pasted
    // booking arrives with them set — no hand-picking afterwards.
    const b = result.booking;
    const fill = async (code: string | undefined, field: "leg.origin" | "leg.destination") => {
      if (!code) return undefined;
      try {
        const r = await fetch(
          "/api/suggestions/statics?field=" + encodeURIComponent(field) + "&q=" + encodeURIComponent(code)
        );
        const d = await r.json();
        const hit = (d.items || []).find(
          (it: { iata?: string }) => it.iata && it.iata.toUpperCase() === code.toUpperCase()
        );
        return hit?.timezone as string | undefined;
      } catch {
        return undefined;
      }
    };
    if (b.origin) b.originTimezone = (await fill(b.origin, "leg.origin")) ?? b.originTimezone;
    if (b.destination)
      b.destinationTimezone = (await fill(b.destination, "leg.destination")) ?? b.destinationTimezone;

    // An unfamiliar airline code still resolves to its full name from
    // the catalog — she should never have to type it.
    if (b.flightNumber && !b.airline) {
      const code = b.flightNumber.slice(0, 2);
      try {
        const r = await fetch(
          "/api/suggestions/statics?field=leg.operator&q=" + encodeURIComponent(code)
        );
        const d = await r.json();
        const hit = (d.items || []).find(
          (it: { iata?: string }) => it.iata && it.iata.toUpperCase() === code
        );
        if (hit?.name) b.airline = hit.name;
      } catch {
        // Catalog unreachable — the code alone still applies cleanly.
      }
    }

    // A parsed ship resolves to its canonical name + cruise line.
    if (result.source === "cruise" && b.ship) {
      try {
        const r = await fetch(
          "/api/suggestions/statics?field=stay.ship&q=" + encodeURIComponent(b.ship)
        );
        const d = await r.json();
        const hit = (d.items || []).find(
          (it: { ship?: string }) => it.ship && it.ship.toLowerCase() === b.ship!.toLowerCase()
        );
        if (hit) {
          b.ship = hit.ship;
          if (hit.line) b.cruiseLine = hit.line;
        }
      } catch {
        // Keep the parsed values as-is.
      }
    }
    setParsed(result);
  }

  function handleApply() {
    if (!parsed) return;
    onApply(parsed.booking);
    onClose();
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Paste Booking Confirmation
        </p>
        <button type="button" onClick={onClose} className="text-xs text-gray-500">
          Cancel
        </button>
      </div>

      <textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setParsed(null);
        }}
        placeholder={"Paste your booking confirmation here.\nExample:\n\nAir Canada AC0020\nYYZ to NRT\nConfirmation: ABC123"}
        rows={6}
        className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-mono"
      />

      {!parsed && (
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={handleParse} disabled={!raw.trim()}>
            Parse
          </Button>
        </div>
      )}

      {parsed && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Detected: <span className="font-medium">{parsed.source}</span>
          </p>

          {parsed.source === "unknown" ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              {parsed.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700">{w}</p>
              ))}
            </div>
          ) : (
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(parsed.booking).map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-1 text-gray-500 w-1/3">{k}</td>
                    <td className="py-1">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setParsed(null)}>
              Re-parse
            </Button>
            {parsed.source !== "unknown" && (
              <Button size="sm" onClick={handleApply}>
                Apply to Form
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
