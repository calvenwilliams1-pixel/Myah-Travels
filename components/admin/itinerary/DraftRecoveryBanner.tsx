"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  findDraftsForEntity,
  clearDraft,
  clearDraftsForEntity,
} from "@/lib/drafts";
import type { Itinerary } from "./ItineraryEditor";

// ============================================================
// DRAFT RECOVERY
// Autosave fields keep a per-keystroke browser draft that is cleared
// only after a successful server save. Any draft still present when
// the editor loads is therefore work that never reached the server
// (crash, closed tab, failed save). This banner surfaces those drafts
// and lets the admin restore or discard them — the restore half of
// the draft system, wired up 2026-11-22.
// ============================================================

const ENDPOINTS: Record<string, (id: number) => string> = {
  itinerary: (id) => `/api/itineraries/${id}`,
  section: (id) => `/api/sections/${id}`,
  day: (id) => `/api/days/${id}`,
  segment: (id) => `/api/segments/${id}`,
  stay: (id) => `/api/stays/${id}`,
};

interface RecoveryItem {
  draftKey: string;
  kind: string;
  entityId: number;
  field: string;
  value: unknown;
  serverValue: unknown;
  timestamp: number;
}

function parseKey(draftKey: string): { kind: string; entityId: number; field: string } | null {
  const parts = draftKey.split(":");
  if (parts.length !== 3) return null;
  const entityId = Number(parts[1]);
  if (!Number.isFinite(entityId)) return null;
  return { kind: parts[0], entityId, field: parts[2] };
}

function collectServerValues(itinerary: Itinerary): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const put = (kind: string, id: number, field: string, v: unknown) =>
    map.set(`${kind}:${id}:${field}`, v ?? "");

  put("itinerary", itinerary.id, "title", itinerary.title);
  for (const section of itinerary.sections) {
    put("section", section.id, "title", section.title);
    put("section", section.id, "baseCity", section.baseCity);
    put("section", section.id, "startDate", section.startDate);
    put("section", section.id, "endDate", section.endDate);
    for (const day of section.days) {
      put("day", day.id, "title", day.title);
      for (const segment of day.segments) {
        const fields: (keyof typeof segment)[] = [
          "title", "location", "instructions", "confirmation", "referenceLabel",
          "departureAirport", "arrivalAirport", "airline", "flightNumber",
          "startTime", "endTime",
        ];
        for (const f of fields) put("segment", segment.id, f, segment[f]);
      }
    }
    for (const stay of section.stays) {
      const fields: (keyof typeof stay)[] = [
        "hotelName", "address", "checkInDate", "checkInTime",
        "checkOutDate", "checkOutTime",
      ];
      for (const f of fields) put("stay", stay.id, f, stay[f]);
    }
  }
  return map;
}

function entityIds(itinerary: Itinerary): Set<string> {
  const ids = new Set<string>();
  ids.add(`itinerary:${itinerary.id}`);
  for (const section of itinerary.sections) {
    ids.add(`section:${section.id}`);
    for (const day of section.days) {
      ids.add(`day:${day.id}`);
      for (const segment of day.segments) ids.add(`segment:${segment.id}`);
    }
    for (const stay of section.stays) ids.add(`stay:${stay.id}`);
  }
  return ids;
}

function belongsTo(key: string, ids: Set<string>): boolean {
  const parsed = parseKey(key);
  if (!parsed) return false;
  return ids.has(`${parsed.kind}:${parsed.entityId}`);
}

function fieldLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default function DraftRecoveryBanner({
  itinerary,
  onRestored,
}: {
  itinerary: Itinerary;
  onRestored: () => void;
}) {
  const [items, setItems] = useState<RecoveryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannedFor = useRef<number | null>(null);

  useEffect(() => {
    if (scannedFor.current === itinerary.id) return;
    scannedFor.current = itinerary.id;

    const ids = entityIds(itinerary);
    const serverValues = collectServerValues(itinerary);
    const findings = findDraftsForEntity((key) => belongsTo(key, ids));

    const recovery: RecoveryItem[] = [];
    for (const f of findings) {
      const parsed = parseKey(f.draftKey);
      if (!parsed || !ENDPOINTS[parsed.kind]) continue;
      const serverValue = serverValues.get(f.draftKey);
      if (serverValue === undefined) continue; // entity gone — leave the draft alone
      if (String(serverValue) === String(f.value ?? "")) {
        clearDraft(f.draftKey); // stale duplicate of what's already saved
        continue;
      }
      recovery.push({
        draftKey: f.draftKey,
        kind: parsed.kind,
        entityId: parsed.entityId,
        field: parsed.field,
        value: f.value,
        serverValue,
        timestamp: f.timestamp,
      });
    }
    setItems(recovery);
  }, [itinerary]);

  if (items.length === 0) return null;

  async function restoreAll() {
    setBusy(true);
    setError(null);
    const remaining: RecoveryItem[] = [];
    for (const item of items) {
      try {
        const res = await fetch(ENDPOINTS[item.kind](item.entityId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [item.field]: item.value }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        clearDraft(item.draftKey);
      } catch {
        remaining.push(item);
      }
    }
    setBusy(false);
    setItems(remaining);
    if (remaining.length > 0) {
      setError("Some drafts could not be restored — they're still saved in this browser.");
    } else {
      onRestored();
    }
  }

  function discardAll() {
    const ids = entityIds(itinerary);
    clearDraftsForEntity((key) => belongsTo(key, ids));
    setItems([]);
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="font-medium text-amber-900">
        You have unsaved work from an earlier session
      </p>
      <p className="text-sm text-amber-800 mt-1">
        These edits were typed but never reached the server (the tab may have
        closed or the connection dropped). Restore them to pick up where you
        left off:
      </p>
      <ul className="mt-2 space-y-1 text-sm text-amber-900">
        {items.map((item) => (
          <li key={item.draftKey}>
            <span className="font-medium">
              {fieldLabel(item.kind)} — {fieldLabel(item.field)}:
            </span>{" "}
            <span className="italic">
              “{String(item.value ?? "").slice(0, 80)}”
            </span>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="flex gap-3 mt-3">
        <Button size="sm" onClick={restoreAll} disabled={busy}>
          {busy ? "Restoring…" : "Restore unsaved work"}
        </Button>
        <Button size="sm" variant="ghost" onClick={discardAll} disabled={busy}>
          Discard
        </Button>
      </div>
    </div>
  );
}
