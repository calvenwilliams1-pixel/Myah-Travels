"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";

export interface TripTab {
  id: number;
  portalId: number | null;
  itineraryId: number | null;
  tripTitle: string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  destination: string | null;
}

interface TripTabsProps {
  trips: TripTab[];
}

export default function TripTabs({ trips }: TripTabsProps) {
  const [activeId, setActiveId] = useState<number | null>(trips[0]?.id ?? null);

  if (trips.length === 0) {
    return <p className="text-sm text-gray-400 italic">No trips recorded yet.</p>;
  }

  const active = trips.find((t) => t.id === activeId) ?? trips[0];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Trip history</h3>

      <div className="flex flex-wrap gap-2">
        {trips.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={
              "px-3 py-1.5 rounded-lg text-sm border transition-colors " +
              (active.id === t.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary")
            }
          >
            {t.tripTitle}
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-2">
          <h4 className="font-semibold">{active.tripTitle}</h4>
          {(active.tripStartDate || active.tripEndDate) && (
            <p className="text-sm text-gray-500">
              {active.tripStartDate || "?"} → {active.tripEndDate || "?"}
            </p>
          )}
          {active.destination && (
            <p className="text-sm text-gray-500">{active.destination}</p>
          )}

          {active.portalId && (
            <a
              href={"/admin/portals/" + active.portalId}
              className="text-sm text-primary hover:underline inline-block"
            >
              View portal →
            </a>
          )}

          {active.itineraryId && active.portalId ? (
            <a
              href={
                "/admin/portals/" +
                active.portalId +
                "/itinerary/" +
                active.itineraryId +
                "/preview"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-block ml-4"
            >
              View itinerary ↗
            </a>
          ) : !active.portalId ? (
            <p className="text-xs text-gray-400 italic">
              Portal purged — itinerary preserved. Open from the Itinerary Library.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
