"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { parseBulkLines, type ParsedSegment } from "@/lib/suggestions/parseBulkLines";

interface BulkAddFormProps {
  dayId: number;
  dayDate: string;
  onSaved: () => void;
  onCancel: () => void;
}

const DRAFT_KEY_PREFIX = "myahtravels:draft:bulk-add:";

const PLACEHOLDER = `08:00-10:00 | Port Disembarkation | Singapore Cruise Port | Disembark following morning announcements
12:00-13:00 | travel/transfer | Cruise Port -> Oakwood Bencoolen | Tour East Singapore
15:00-16:00 | Hotel Check-in | Oakwood Bencoolen
18:00-19:00 | Marina Bay Sands & Helix Bridge | Bayfront Station
# Lines starting with # are ignored
07:00-06:25 | travel/flight | SIN -> YVR | AC0020 | COPNYP`;

export default function BulkAddForm({ dayId, dayDate, onSaved, onCancel }: BulkAddFormProps) {
  const draftKey = DRAFT_KEY_PREFIX + dayId;
  const [raw, setRaw] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedSegments, setEditedSegments] = useState<ParsedSegment[] | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) setRaw(stored);
    } catch {
      // localStorage unavailable — ignore
    }
  }, [draftKey]);

  // Persist draft on change
  useEffect(() => {
    try {
      if (raw) localStorage.setItem(draftKey, raw);
      else localStorage.removeItem(draftKey);
    } catch {
      // swallow
    }
  }, [raw, draftKey]);

  const parsed = useMemo(() => parseBulkLines(raw, dayDate), [raw, dayDate]);
  const segments = editedSegments ?? parsed.segments;

  function handleEditSegment(index: number, patch: Partial<ParsedSegment>) {
    const next = [...segments];
    next[index] = { ...next[index], ...patch };
    setEditedSegments(next);
  }

  function clearDraft() {
    setRaw("");
    setEditedSegments(null);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // swallow
    }
  }

  async function handleCommit() {
    if (parsed.errors.length > 0) {
      setError("Fix parse errors before committing");
      return;
    }
    if (segments.length === 0) {
      setError("Nothing to add");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/days/${dayId}/segments/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segments: segments.map((s) => ({
          type: s.type,
          startTime: s.startTime || undefined,
          endTime: s.endTime || undefined,
          title: s.title,
          location: s.location || undefined,
          instructions: s.notes || undefined,
          leg: s.leg
            ? {
                travelMode: s.leg.travelMode,
                origin: s.leg.origin || undefined,
                destination: s.leg.destination || undefined,
                departureAt: s.leg.departureAt || undefined,
                arrivalAt: s.leg.arrivalAt || undefined,
                identifier: s.leg.identifier || undefined,
                reference: s.leg.reference || undefined,
              }
            : undefined,
        })),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Bulk insert failed");
      setIsSaving(false);
      return;
    }

    clearDraft();
    onSaved();
  }

  return (
    <Card className="mb-3 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Bulk Add Segments</h4>
        <button
          type="button"
          onClick={clearDraft}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="Clear the textarea and any saved draft"
          aria-label="Clear draft"
        >
          Clear draft
        </button>
      </div>

      <textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setEditedSegments(null);
        }}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
      />

      <p className="text-xs text-gray-500 mt-1">
        One segment per line. Format: <code>HH:MM-HH:MM | Title | Location | Notes</code>. Travel: <code>HH:MM-HH:MM | travel/flight | ORIGIN -&gt; DEST | ID | REF</code>. Tabs work too. Lines starting with # are ignored.
      </p>

      {parsed.errors.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs font-medium text-red-700 mb-1">Errors ({parsed.errors.length})</p>
          {parsed.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600">
              Line {e.line}: {e.reason}
            </p>
          ))}
        </div>
      )}

      {parsed.warnings.length > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs font-medium text-amber-700 mb-1">Warnings ({parsed.warnings.length})</p>
          {parsed.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600">
              Line {w.line}: {w.reason}
            </p>
          ))}
        </div>
      )}

      {segments.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
            Preview — {segments.length} segment{segments.length !== 1 ? "s" : ""}
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-2 py-1 font-medium text-gray-600">Time</th>
                <th className="text-left px-2 py-1 font-medium text-gray-600">Type</th>
                <th className="text-left px-2 py-1 font-medium text-gray-600">Title</th>
                <th className="text-left px-2 py-1 font-medium text-gray-600">Location</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={s.startTime}
                      onChange={(e) => handleEditSegment(i, { startTime: e.target.value })}
                      className="w-16 px-1 py-0.5 border border-gray-200 rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1 text-gray-500">{s.type}</td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={s.title}
                      onChange={(e) => handleEditSegment(i, { title: e.target.value })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={s.location}
                      onChange={(e) => handleEditSegment(i, { location: e.target.value })}
                      className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleCommit}
          disabled={isSaving || segments.length === 0 || parsed.errors.length > 0}
        >
          {isSaving ? "Adding..." : `Add ${segments.length} segment${segments.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </Card>
  );
}
