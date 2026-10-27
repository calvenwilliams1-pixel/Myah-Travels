"use client";

import React from "react";
import type { GlanceData, GlanceTransport } from "@/lib/itineraries/derive";

interface ItineraryGlanceViewProps {
  glance: GlanceData;
}

function transportIcon(mode: GlanceTransport["mode"]): string {
  switch (mode) {
    case "flight":
      return "✈️";
    case "train":
      return "🚆";
    case "bus":
      return "🚌";
    case "transfer":
      return "🚐";
    default:
      return "➡️";
  }
}

function formatTransport(t: GlanceTransport): string {
  const parts: string[] = [];
  if (t.operator) parts.push(t.operator);
  if (t.identifier) parts.push(t.identifier);
  const base = parts.join(" ") || t.mode;
  return t.legCount > 1 ? `${base} (+${t.legCount - 1} connection${t.legCount > 2 ? "s" : ""})` : base;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  try {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

export default function ItineraryGlanceView({ glance }: ItineraryGlanceViewProps) {
  return (
    <div className="glance-view bg-white p-6 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-1 print:hidden">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">
          Trip Summary · At a Glance
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:opacity-90"
          aria-label="Print itinerary glance"
        >
          Print
        </button>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        {glance.itineraryTitle}
      </h2>

      {glance.days.length === 0 && (
        <p className="text-gray-500 italic">No days in this itinerary yet.</p>
      )}

      <div className="space-y-4">
        {glance.days.map((day) => (
          <div
            key={day.dayNumber}
            className="glance-day border-l-4 border-primary/40 pl-4 py-1"
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-semibold text-gray-900">
                Day {day.dayNumber}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(day.date)}
              </span>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {day.sectionTitle}
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              {day.stayName && (
                <li>
                  <span className="mr-2">🏨</span>
                  {day.stayName}
                </li>
              )}
              {day.transport.map((t, i) => (
                <li key={i}>
                  <span className="mr-2">{transportIcon(t.mode)}</span>
                  {formatTransport(t)}
                </li>
              ))}
              {day.anchorActivity && (
                <li>
                  <span className="mr-2">•</span>
                  {day.anchorActivity}
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
