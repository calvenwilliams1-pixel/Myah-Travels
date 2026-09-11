import React from "react";

interface Segment {
  id: number;
  type: string;
  startTime: string | null;
  endTime: string | null;
  title: string;
  location: string | null;
  instructions: string | null;
  confirmation: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureDatetime: string | null;
  arrivalDatetime: string | null;
  airline: string | null;
  flightNumber: string | null;
}

interface Day {
  id: number;
  date: string;
  dayNumber: number;
  title: string | null;
  segments: Segment[];
}

interface Stay {
  id: number;
  hotelName: string;
  address: string | null;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface Section {
  id: number;
  title: string;
  baseCity: string | null;
  startDate: string | null;
  endDate: string | null;
  days: Day[];
  stays: Stay[];
}

interface Itinerary {
  id: number;
  title: string;
  sections: Section[];
}

interface ItineraryViewProps {
  itinerary: Itinerary;
  portalSlug: string;
}

const SEGMENT_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  activity: { bg: "bg-primary/5", border: "border-primary/20", icon: "🎯", label: "Activity" },
  travel: { bg: "bg-info/5", border: "border-info/20", icon: "✈️", label: "Travel" },
  meal: { bg: "bg-warning/5", border: "border-warning/20", icon: "🍽️", label: "Meal" },
  free_day: { bg: "bg-gray-50", border: "border-gray-200", icon: "🌴", label: "Free Day" },
};

export default function ItineraryView({ itinerary, portalSlug }: ItineraryViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Print header — hidden on screen */}
      <div className="hidden print:block px-6 py-4 border-b border-gray-200">
        <p className="text-xs text-gray-500">
          Printed {new Date().toLocaleString()} · View latest online: /portal/{portalSlug}/itinerary/{itinerary.id}
        </p>
      </div>

      {/* Screen header */}
      <div className="bg-white border-b border-gray-200 print:border-0 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href={`/portal/${portalSlug}`}
            className="text-sm text-gray-500 hover:text-primary print:hidden"
          >
            ← Back to wall
          </a>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="text-sm text-primary hover:underline print:hidden"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{itinerary.title}</h1>
        <p className="text-gray-500 mb-8">
          {itinerary.sections.length} section{itinerary.sections.length !== 1 ? "s" : ""} ·{" "}
          {itinerary.sections.reduce((sum, s) => sum + s.days.length, 0)} days
        </p>

        {itinerary.sections.map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
      </div>

      {/* Print footer */}
      <div className="hidden print:block px-6 py-4 border-t border-gray-200 text-xs text-gray-500">
        This itinerary is a snapshot. View latest online: /portal/{portalSlug}/itinerary/{itinerary.id}
      </div>
    </div>
  );
}

function SectionView({ section }: { section: Section }) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">{section.title}</h2>
        {section.baseCity && (
          <p className="text-sm text-gray-500">Base city: {section.baseCity}</p>
        )}
        {section.startDate && section.endDate && (
          <p className="text-sm text-gray-500">
            {formatDate(section.startDate)} – {formatDate(section.endDate)}
          </p>
        )}
      </div>

      {section.stays.length > 0 && (
        <div className="mb-6 space-y-2">
          {section.stays.map((stay) => (
            <div
              key={stay.id}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3 print:border-gray-300"
            >
              <span className="text-xl">🏨</span>
              <div className="flex-1">
                <p className="font-medium">{stay.hotelName}</p>
                {stay.address && <p className="text-xs text-gray-500">{stay.address}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(stay.checkInDate)} → {formatDate(stay.checkOutDate)}
                  {stay.checkInTime && ` · Check-in ${stay.checkInTime}`}
                  {stay.checkOutTime && ` · Check-out ${stay.checkOutTime}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {section.days.map((day) => (
          <DayView key={day.id} day={day} stays={section.stays} />
        ))}
      </div>
    </section>
  );
}

function DayView({ day, stays }: { day: Day; stays: Stay[] }) {
  const stayTonight = stays.find(
    (s) => s.checkInDate <= day.date && day.date < s.checkOutDate
  );

  const grouped = groupByTimeOfDay(day.segments);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden print:border-gray-300 print:break-inside-avoid">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 print:bg-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌹</span>
          <div>
            <p className="font-semibold">
              Day {day.dayNumber} · {formatDate(day.date)}
            </p>
            {day.title && <p className="text-sm text-gray-600">{day.title}</p>}
          </div>
        </div>
        {stayTonight && (
          <p className="text-xs text-gray-500 mt-2">
            🏨 Sleeping at: <span className="font-medium">{stayTonight.hotelName}</span>
          </p>
        )}
      </div>

      <div className="p-4">
        {day.segments.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">
            No activities scheduled
          </p>
        ) : (
          <div className="space-y-6">
            {(["morning", "afternoon", "evening", "unscheduled"] as const).map((slot) => {
              const segs = grouped[slot];
              if (segs.length === 0) return null;

              return (
                <div key={slot}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {slotLabel(slot)}
                  </p>
                  <div className="space-y-3">
                    {segs.map((seg) => (
                      <SegmentCard key={seg.id} segment={seg} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentCard({ segment }: { segment: Segment }) {
  const style = SEGMENT_STYLES[segment.type] || SEGMENT_STYLES.activity;

  if (segment.type === "travel") {
    return <TravelCard segment={segment} />;
  }

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{style.icon}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-medium">{segment.title}</p>
            {segment.startTime && (
              <span className="text-xs text-gray-500">
                {segment.startTime}
                {segment.endTime && ` – ${segment.endTime}`}
              </span>
            )}
          </div>
          {segment.location && (
            <p className="text-sm text-gray-600 mt-0.5">📍 {segment.location}</p>
          )}
          {segment.instructions && (
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
              {segment.instructions}
            </p>
          )}
          {segment.confirmation && (
            <p className="text-xs text-gray-500 mt-2">
              Confirmation: <span className="font-mono">{segment.confirmation}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TravelCard({ segment }: { segment: Segment }) {
  const style = SEGMENT_STYLES.travel;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">✈️</span>
        <div className="flex-1">
          <p className="font-medium mb-3">{segment.title}</p>

          {(segment.departureAirport || segment.arrivalAirport) && (
            <div className="flex items-center gap-3 mb-2">
              <div className="text-center">
                <p className="text-lg font-bold">{segment.departureAirport || "?"}</p>
                {segment.departureDatetime && (
                  <p className="text-xs text-gray-500">
                    {formatDateTime(segment.departureDatetime)}
                  </p>
                )}
              </div>
              <span className="text-gray-400">→</span>
              <div className="text-center">
                <p className="text-lg font-bold">{segment.arrivalAirport || "?"}</p>
                {segment.arrivalDatetime && (
                  <p className="text-xs text-gray-500">
                    {formatDateTime(segment.arrivalDatetime)}
                  </p>
                )}
              </div>
            </div>
          )}

          {(segment.airline || segment.flightNumber) && (
            <p className="text-sm text-gray-700">
              {segment.airline} {segment.flightNumber && `· ${segment.flightNumber}`}
            </p>
          )}

          {segment.confirmation && (
            <p className="text-xs text-gray-500 mt-1">
              Confirmation: <span className="font-mono">{segment.confirmation}</span>
            </p>
          )}

          {segment.instructions && (
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
              {segment.instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function groupByTimeOfDay(segments: Segment[]) {
  const groups: Record<"morning" | "afternoon" | "evening" | "unscheduled", Segment[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    unscheduled: [],
  };

  for (const seg of segments) {
    if (!seg.startTime) {
      groups.unscheduled.push(seg);
      continue;
    }
    const hour = parseInt(seg.startTime.split(":")[0], 10);
    if (hour < 12) groups.morning.push(seg);
    else if (hour < 17) groups.afternoon.push(seg);
    else groups.evening.push(seg);
  }

  return groups;
}

function slotLabel(slot: string): string {
  switch (slot) {
    case "morning": return "☀️ Morning";
    case "afternoon": return "⛅ Afternoon";
    case "evening": return "🌙 Evening";
    case "unscheduled": return "📌 Other";
    default: return slot;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dt: string): string {
  try {
    return new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}
