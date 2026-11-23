"use client";

import React, { useMemo } from "react";
import { checkTrip, type CheckSection } from "@/lib/itineraries/checks";

interface TripChecksPanelProps {
  sections: CheckSection[];
}

/**
 * Accuracy warnings for the whole trip (Phase 8 Batch 4). Advisory
 * only — nothing here blocks saving. Recomputes from the editor's
 * loaded data on every refresh.
 */
export default function TripChecksPanel({ sections }: TripChecksPanelProps) {
  const checks = useMemo(() => checkTrip(sections), [sections]);

  if (checks.nights.length === 0 && checks.warnings.length === 0) return null;

  const allGood = checks.warnings.length === 0;

  return (
    <div
      className={`rounded-lg border p-3 mb-4 ${
        allGood ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <p className={`text-sm font-medium ${allGood ? "text-green-800" : "text-amber-800"}`}>
        {allGood
          ? `✓ Trip checks passed — ${checks.accountedNights} of ${checks.totalNights} nights have a stay, and no timing problems were found.`
          : "⚠️ Worth a look before this goes to the client — nothing here blocks saving:"}
      </p>
      {checks.warnings.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc pl-5">
          {checks.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {checks.nights.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Nights with a stay:{" "}
          {checks.nights
            .map((n) => `${n.sectionTitle} ${n.accounted}/${n.total}`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
