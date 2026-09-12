"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ============================================
// TYPES
// ============================================

interface Segment {
  id: number;
  dayId: number;
  type: "activity" | "travel" | "meal" | "free_day";
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
  sectionId: number;
  date: string;
  dayNumber: number;
  title: string | null;
  notes: string | null;
  segments: Segment[];
}

interface Stay {
  id: number;
  sectionId: number;
  hotelName: string;
  address: string | null;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
}

interface Section {
  id: number;
  itineraryId: number;
  title: string;
  baseCity: string | null;
  startDate: string | null;
  endDate: string | null;
  position: number;
  days: Day[];
  stays: Stay[];
}

interface Itinerary {
  id: number;
  portalId: number;
  title: string;
  sections: Section[];
}

// ============================================
// MAIN EDITOR
// ============================================

export default function ItineraryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const portalId = Number(params.id);
  const itineraryId = Number(params.itineraryId);

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function fetchItinerary() {
    const res = await fetch(`/api/itineraries/${itineraryId}`);
    const data = await res.json();
    setItinerary(data.itinerary);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchItinerary();
  }, [itineraryId]);

  async function updateTitle(title: string) {
    await fetch(`/api/itineraries/${itineraryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    fetchItinerary();
  }

  async function addSection() {
    const title = prompt("Section title (e.g., \"Japan Pre-Cruise\"):");
    if (!title) return;

    await fetch(`/api/itineraries/${itineraryId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    fetchItinerary();
  }

  async function deleteSection(sectionId: number) {
    if (!confirm("Delete this section and all its days/stays?")) return;
    await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
    fetchItinerary();
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!itinerary) return <p className="text-gray-500">Itinerary not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <a href={`/admin/portals/${portalId}/itinerary`}>
            <Button variant="ghost">← Back</Button>
          </a>
          <input
            type="text"
            value={itinerary.title}
            onChange={(e) => setItinerary({ ...itinerary, title: e.target.value })}
            onBlur={(e) => updateTitle(e.target.value)}
            className="text-2xl font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-3">
          <a
            href={`/admin/portals/${portalId}/itinerary/${itineraryId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost">Preview ↗</Button>
          </a>
          <Button onClick={addSection}>+ Add Section</Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 font-medium mb-1">Warnings:</p>
          <ul className="text-sm text-amber-700 list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      )}

      {itinerary.sections.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            No sections yet. Add your first section to get started.
          </p>
        </Card>
      ) : (
        itinerary.sections.map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            onChanged={fetchItinerary}
            onDelete={() => deleteSection(section.id)}
          />
        ))
      )}
    </div>
  );
}

// ============================================
// SECTION EDITOR
// ============================================

function SectionEditor({
  section,
  onChanged,
  onDelete,
}: {
  section: Section;
  onChanged: () => void;
  onDelete: () => void;
}) {
  async function updateSection(data: Partial<Section>) {
    await fetch(`/api/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onChanged();
  }

  async function addDay() {
    const date = prompt("Date (YYYY-MM-DD):");
    if (!date) return;
    const dayNumber = section.days.length + 1;

    await fetch(`/api/sections/${section.id}/days`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, dayNumber }),
    });
    onChanged();
  }

  async function addStay() {
    const hotelName = prompt("Hotel name:");
    if (!hotelName) return;
    const checkInDate = prompt("Check-in date (YYYY-MM-DD):");
    if (!checkInDate) return;
    const checkOutDate = prompt("Check-out date (YYYY-MM-DD):");
    if (!checkOutDate) return;

    await fetch(`/api/sections/${section.id}/stays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelName, checkInDate, checkOutDate }),
    });
    onChanged();
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-1">
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection({ title: e.target.value })}
            className="text-xl font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary focus:outline-none flex-1"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500">
          Delete Section
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Base City"
          value={section.baseCity || ""}
          onChange={(e) => updateSection({ baseCity: e.target.value })}
          placeholder="Yokohama"
        />
        <Input
          label="Start Date"
          type="date"
          value={section.startDate || ""}
          onChange={(e) => updateSection({ startDate: e.target.value })}
        />
        <Input
          label="End Date"
          type="date"
          value={section.endDate || ""}
          onChange={(e) => updateSection({ endDate: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700">Stays</h4>
          <Button size="sm" variant="ghost" onClick={addStay}>+ Add Stay</Button>
        </div>
        {section.stays.length === 0 ? (
          <p className="text-xs text-gray-400">No stays added.</p>
        ) : (
          <div className="space-y-2">
            {section.stays.map((stay) => (
              <StayRow key={stay.id} stay={stay} onChanged={onChanged} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700">Days</h4>
          <Button size="sm" variant="ghost" onClick={addDay}>+ Add Day</Button>
        </div>
        {section.days.length === 0 ? (
          <p className="text-xs text-gray-400">No days added.</p>
        ) : (
          <div className="space-y-3">
            {section.days.map((day) => (
              <DayEditor key={day.id} day={day} onChanged={onChanged} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// STAY ROW
// ============================================

function StayRow({ stay, onChanged }: { stay: Stay; onChanged: () => void }) {
  async function update(data: Partial<Stay>) {
    await fetch(`/api/stays/${stay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this stay?")) return;
    await fetch(`/api/stays/${stay.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="flex gap-2 items-center text-sm">
      <input
        type="text"
        value={stay.hotelName}
        onChange={(e) => update({ hotelName: e.target.value })}
        className="flex-1 px-2 py-1 border border-gray-200 rounded"
        placeholder="Hotel name"
      />
      <input
        type="date"
        value={stay.checkInDate}
        onChange={(e) => update({ checkInDate: e.target.value })}
        className="px-2 py-1 border border-gray-200 rounded cursor-pointer"
      />
      <span className="text-gray-400">→</span>
      <input
        type="date"
        value={stay.checkOutDate}
        onChange={(e) => update({ checkOutDate: e.target.value })}
        className="px-2 py-1 border border-gray-200 rounded cursor-pointer"
      />
      <button onClick={remove} className="text-red-500 px-2">✕</button>
    </div>
  );
}

// ============================================
// DAY EDITOR
// ============================================

function DayEditor({ day, onChanged }: { day: Day; onChanged: () => void }) {
  async function update(data: Partial<Day>) {
    await fetch(`/api/days/${day.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onChanged();
  }

  async function addSegment() {
    const type = prompt("Segment type (activity/travel/meal/free_day):");
    if (!type || !["activity", "travel", "meal", "free_day"].includes(type)) return;
    const title = prompt("Title:");
    if (!title) return;

    const body: any = { type, title };

    if (type === "travel") {
      body.departureAirport = prompt("Departure airport:") || undefined;
      body.arrivalAirport = prompt("Arrival airport:") || undefined;
      body.departureDatetime = prompt("Departure datetime (ISO):") || undefined;
      body.arrivalDatetime = prompt("Arrival datetime (ISO):") || undefined;
      body.airline = prompt("Airline:") || undefined;
      body.flightNumber = prompt("Flight number:") || undefined;
    } else {
      body.startTime = prompt("Start time (HH:MM):") || undefined;
      body.endTime = prompt("End time (HH:MM):") || undefined;
      body.location = prompt("Location:") || undefined;
    }

    await fetch(`/api/days/${day.id}/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    onChanged();
  }

  async function deleteDay() {
    if (!confirm("Delete this day?")) return;
    await fetch(`/api/days/${day.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="border-l-2 border-gray-200 pl-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Day {day.dayNumber}</span>
        <input
          type="date"
          value={day.date}
          readOnly
          className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-200 rounded cursor-pointer"
        />
        <input
          type="text"
          value={day.title || ""}
          onChange={(e) => update({ title: e.target.value })}
          className="flex-1 text-sm px-2 py-0.5 border border-transparent hover:border-gray-200 focus:border-primary focus:outline-none rounded"
          placeholder="Day title (optional)"
        />
        <Button size="sm" variant="ghost" onClick={addSegment}>+ Segment</Button>
        <button onClick={deleteDay} className="text-red-500 text-sm">✕</button>
      </div>

      {day.segments.length === 0 ? (
        <p className="text-xs text-gray-400 pl-2">No segments — will render as "No activities scheduled"</p>
      ) : (
        <div className="space-y-1 pl-2">
          {day.segments.map((seg) => (
            <SegmentRow key={seg.id} segment={seg} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SEGMENT ROW
// ============================================

function SegmentRow({ segment, onChanged }: { segment: Segment; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(segment);

  async function save() {
    await fetch(`/api/segments/${segment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false);
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this segment?")) return;
    await fetch(`/api/segments/${segment.id}`, { method: "DELETE" });
    onChanged();
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 text-sm py-1">
        <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{segment.type}</span>
        {segment.startTime && (
          <span className="text-xs text-gray-500">{segment.startTime}–{segment.endTime || "?"}</span>
        )}
        <span className="flex-1">{segment.title}</span>
        {segment.location && <span className="text-xs text-gray-500">{segment.location}</span>}
        <button onClick={() => setIsEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">edit</button>
        <button onClick={remove} className="text-xs text-red-500">✕</button>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded p-2 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as any })}
          className="px-2 py-1 border border-gray-200 rounded text-sm cursor-pointer"
        >
          <option value="activity">Activity</option>
          <option value="travel">Travel</option>
          <option value="meal">Meal</option>
          <option value="free_day">Free Day</option>
        </select>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="col-span-2 px-2 py-1 border border-gray-200 rounded text-sm"
        />
      </div>

      {form.type === "travel" ? (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.departureAirport || ""}
            onChange={(e) => setForm({ ...form, departureAirport: e.target.value })}
            placeholder="From (YYZ)"
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          />
          <input
            type="text"
            value={form.arrivalAirport || ""}
            onChange={(e) => setForm({ ...form, arrivalAirport: e.target.value })}
            placeholder="To (NRT)"
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          />
          <input
            type="datetime-local"
            value={form.departureDatetime || ""}
            onChange={(e) => setForm({ ...form, departureDatetime: e.target.value })}
            className="px-2 py-1 border border-gray-200 rounded text-sm cursor-pointer"
          />
          <input
            type="datetime-local"
            value={form.arrivalDatetime || ""}
            onChange={(e) => setForm({ ...form, arrivalDatetime: e.target.value })}
            className="px-2 py-1 border border-gray-200 rounded text-sm cursor-pointer"
          />
          <input
            type="text"
            value={form.airline || ""}
            onChange={(e) => setForm({ ...form, airline: e.target.value })}
            placeholder="Airline"
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          />
          <input
            type="text"
            value={form.flightNumber || ""}
            onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
            placeholder="Flight #"
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <input
            type="time"
            value={form.startTime || ""}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="px-2 py-1 border border-gray-200 rounded text-sm cursor-pointer"
          />
          <input
            type="time"
            value={form.endTime || ""}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="px-2 py-1 border border-gray-200 rounded text-sm cursor-pointer"
          />
          <input
            type="text"
            value={form.location || ""}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location"
            className="px-2 py-1 border border-gray-200 rounded text-sm"
          />
        </div>
      )}

      <textarea
        value={form.instructions || ""}
        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        placeholder="Instructions"
        rows={2}
        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
      />

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
        <Button size="sm" onClick={save}>Save</Button>
      </div>
    </div>
  );
}
