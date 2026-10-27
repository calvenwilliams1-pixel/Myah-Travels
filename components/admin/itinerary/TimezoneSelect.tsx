"use client";

import React, { useMemo, useState } from "react";

interface TimezoneSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  inheritLabel?: string;
  helperText?: string;
}

function allTimezones(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      return (Intl as any).supportedValuesOf("timeZone");
    } catch {}
  }
  return [
    "UTC", "America/Toronto", "America/Vancouver", "America/Los_Angeles",
    "America/New_York", "Europe/London", "Europe/Paris", "Asia/Tokyo",
    "Asia/Taipei", "Asia/Singapore", "Australia/Sydney",
  ];
}

function groupByRegion(zones: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const tz of zones) {
    const region = tz.includes("/") ? tz.split("/")[0] : "Other";
    if (!groups[region]) groups[region] = [];
    groups[region].push(tz);
  }
  return groups;
}

export default function TimezoneSelect({
  value, onChange, inheritLabel = "Inherit", helperText,
}: TimezoneSelectProps) {
  const [search, setSearch] = useState("");
  const allZones = useMemo(() => allTimezones(), []);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allZones;
    return allZones.filter((tz) => tz.toLowerCase().includes(q));
  }, [allZones, search]);
  const grouped = useMemo(() => groupByRegion(filtered), [filtered]);
  const regionOrder = ["Africa", "America", "Antarctica", "Asia", "Atlantic", "Australia", "Europe", "Indian", "Pacific", "Other"];
  const orderedRegions = Object.keys(grouped).sort((a, b) => {
    const ai = regionOrder.indexOf(a);
    const bi = regionOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search timezone..."
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm mb-2"
      />
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      >
        <option value="">{inheritLabel}</option>
        {orderedRegions.map((region) => (
          <optgroup key={region} label={region}>
            {grouped[region].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
