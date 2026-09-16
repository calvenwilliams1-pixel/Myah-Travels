"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface CopySegmentModalProps {
  targetItineraryId: number;
  targetDayId: number;
  onClose: () => void;
  onCopied: () => void;
}

interface PortalOption {
  id: number;
  name: string;
  slug: string;
}

interface ItineraryOption {
  id: number;
  title: string;
}

interface SegmentOption {
  id: number;
  title: string;
  dayNumber: number;
  dayDate: string;
}

type Step = "portal" | "itinerary" | "segment";

export default function CopySegmentModal({
  targetItineraryId,
  targetDayId,
  onClose,
  onCopied,
}: CopySegmentModalProps) {
  const [step, setStep] = useState<Step>("portal");
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [selectedPortal, setSelectedPortal] = useState<PortalOption | null>(null);
  const [itineraries, setItineraries] = useState<ItineraryOption[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryOption | null>(null);
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Load portals
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/portals")
      .then((r) => r.json())
      .then((d) => {
        setPortals(d.portals || []);
        setIsLoading(false);
      })
      .catch((e) => {
        setError("Failed to load portals");
        setIsLoading(false);
      });
  }, []);

  async function loadItineraries(portal: PortalOption) {
    setSelectedPortal(portal);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/" + portal.id + "/itineraries");
      const data = await res.json();
      setItineraries(data.itineraries || []);
      setStep("itinerary");
    } catch {
      setError("Failed to load itineraries");
    }
    setIsLoading(false);
  }

  async function loadSegments(itinerary: ItineraryOption) {
    setSelectedItinerary(itinerary);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/itineraries/" + itinerary.id);
      const data = await res.json();
      const list: SegmentOption[] = [];
      for (const section of data.itinerary?.sections || []) {
        for (const day of section.days || []) {
          for (const seg of day.segments || []) {
            list.push({
              id: seg.id,
              title: seg.title,
              dayNumber: day.dayNumber,
              dayDate: day.date,
            });
          }
        }
      }
      setSegments(list);
      setStep("segment");
    } catch {
      setError("Failed to load segments");
    }
    setIsLoading(false);
  }

  async function copySegment(segment: SegmentOption) {
    setIsCopying(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/itineraries/" + targetItineraryId + "/copy-segment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceSegmentId: segment.id,
            targetDayId,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Copy failed");
        setIsCopying(false);
        return;
      }
      onCopied();
      onClose();
    } catch {
      setError("Copy failed");
      setIsCopying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-5 max-w-xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Copy a segment from another itinerary</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Breadcrumb */}
        <p className="text-xs text-gray-500 mb-3">
          {selectedPortal ? selectedPortal.name : "Choose portal"}
          {selectedItinerary ? " > " + selectedItinerary.title : ""}
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {isLoading ? (
          <p className="text-sm text-gray-500 py-6 text-center">Loading...</p>
        ) : step === "portal" ? (
          <div className="overflow-y-auto flex-1 space-y-1">
            {portals.length === 0 && (
              <p className="text-sm text-gray-400 italic py-4">No portals found.</p>
            )}
            {portals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => loadItineraries(p)}
                className="w-full text-left px-3 py-2 rounded hover:bg-primary/10"
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : step === "itinerary" ? (
          <div className="overflow-y-auto flex-1 space-y-1">
            {itineraries.length === 0 && (
              <p className="text-sm text-gray-400 italic py-4">No itineraries on this portal.</p>
            )}
            {itineraries.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => loadSegments(it)}
                className="w-full text-left px-3 py-2 rounded hover:bg-primary/10"
              >
                {it.title}
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-1">
            {segments.length === 0 && (
              <p className="text-sm text-gray-400 italic py-4">No segments in this itinerary.</p>
            )}
            {segments.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={isCopying}
                onClick={() => copySegment(s)}
                className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 disabled:opacity-50"
              >
                <span className="text-xs text-gray-400 mr-2">
                  Day {s.dayNumber} ({s.dayDate})
                </span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
