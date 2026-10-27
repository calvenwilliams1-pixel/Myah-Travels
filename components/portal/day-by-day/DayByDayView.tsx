"use client";

import React from "react";
import type { DayByDayState, DayByDayTransport } from "@/lib/itineraries/derive";

interface DayByDayViewProps {
  dayByDay: DayByDayState;
  itineraryTitle: string;
}

function transportIcon(mode: DayByDayTransport["mode"]): string {
  switch (mode) {
    case "flight": return "✈️";
    case "train": return "🚆";
    case "bus": return "🚌";
    case "transfer": return "🚐";
    default: return "➡️";
  }
}

function formatTransport(t: DayByDayTransport): string {
  const parts: string[] = [];
  if (t.operator) parts.push(t.operator);
  if (t.identifier) parts.push(t.identifier);
  const base = parts.join(" ") || t.mode;
  const route = t.origin && t.destination ? ` (${t.origin} → ${t.destination})` : "";
  const connections = t.legCount > 1 ? ` +${t.legCount - 1}` : "";
  return `${base}${route}${connections}`;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  try {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return raw;
  }
}

function formatTime(raw: string | null): string {
  if (!raw) return "";
  // "14:00" -> "2:00 PM"
  const [h, m] = raw.split(":");
  if (h === undefined || m === undefined) return raw;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${ampm}`;
}

export default function DayByDayView({ dayByDay, itineraryTitle }: DayByDayViewProps) {
  if (dayByDay.state === "post-trip") {
    return (
      <div className="day-by-day-banner bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <p className="text-2xl mb-2">🌴</p>
        <p className="text-lg font-semibold text-gray-900">Welcome home</p>
        <p className="text-sm text-gray-600">Safe travels — see you on the next one.</p>
      </div>
    );
  }

  if (dayByDay.state === "no-window") {
    return null;
  }

  if (dayByDay.state === "no-plan-today") {
    return (
      <div className="day-by-day-banner bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-600">Nothing scheduled today. Enjoy the free time.</p>
      </div>
    );
  }

  if (dayByDay.state === "pre-trip") {
    return (
      <div className="day-by-day-banner bg-primary/5 border border-primary/20 rounded-lg p-6">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Coming up</p>
        <p className="text-2xl font-semibold text-gray-900 mb-1">
          {dayByDay.daysUntil === 0
            ? "Your trip starts today"
            : dayByDay.daysUntil === 1
              ? "1 day until your trip"
              : `${dayByDay.daysUntil} days until your trip`}
        </p>
        <p className="text-sm text-gray-600">{dayByDay.destination}</p>
      </div>
    );
  }

  // during-trip
  const day = dayByDay.day;
  return (
    <div className="day-by-day-banner bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-primary/5 border-b border-primary/20 px-6 py-3">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">
          Today's Plan · {itineraryTitle}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          Day {day.dayNumber} · {formatDate(day.date)}
        </p>
        <p className="text-xs text-gray-500">{day.sectionTitle}</p>
      </div>

      <div className="p-6 space-y-4">
        {day.stay && (
          <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
            <span className="text-xl">🏨</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{day.stay.hotelName}</p>
              <div className="text-xs text-gray-500 space-x-3">
                {day.stay.isCheckinDay && day.stay.checkInTime && (
                  <span>Check-in {formatTime(day.stay.checkInTime)}</span>
                )}
                {day.stay.isCheckoutDay && day.stay.checkOutTime && (
                  <span>Check-out {formatTime(day.stay.checkOutTime)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {day.segments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nothing scheduled today.</p>
        ) : (
          <div className="space-y-3">
            {day.segments.map((seg, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-sm text-gray-400 w-16 shrink-0">
                  {formatTime(seg.startTime)}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {seg.transport && <span className="mr-2">{transportIcon(seg.transport.mode)}</span>}
                    {seg.title}
                  </p>
                  {seg.transport && (
                    <p className="text-xs text-gray-600">{formatTransport(seg.transport)}</p>
                  )}
                  {seg.location && (
                    <p className="text-xs text-gray-500">📍 {seg.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
