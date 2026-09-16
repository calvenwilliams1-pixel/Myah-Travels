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

  function handleParse() {
    setParsed(parseBooking(raw));
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
