"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AddSectionForm from "./AddSectionForm";
import SectionEditor from "./SectionEditor";

// ============================================
// TYPES
// ============================================

export interface Segment {
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

export interface Day {
  id: number;
  sectionId: number;
  date: string;
  dayNumber: number;
  title: string | null;
  notes: string | null;
  segments: Segment[];
}

export interface Stay {
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

export interface Section {
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

export interface Itinerary {
  id: number;
  portalId: number;
  title: string;
  sections: Section[];
}

export interface PortalBounds {
  departureDate: string | null;
  returnDate: string | null;
}

// ============================================
// MAIN EDITOR
// ============================================

interface ItineraryEditorProps {
  portalId: number;
  itineraryId: number;
}

export default function ItineraryEditor({
  portalId,
  itineraryId,
}: ItineraryEditorProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [portalBounds, setPortalBounds] = useState<PortalBounds>({
    departureDate: null,
    returnDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);

  async function fetchItinerary() {
    const res = await fetch(`/api/itineraries/${itineraryId}`);
    const data = await res.json();
    setItinerary(data.itinerary);
    if (data.portal) {
      setPortalBounds({
        departureDate: data.portal.departureDate ?? null,
        returnDate: data.portal.returnDate ?? null,
      });
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <a href={`/admin/portals/${portalId}/itinerary`}>
            <Button variant="ghost">← Back</Button>
          </a>
          <div className="flex-1">
            <AutosaveTextField
              value={itinerary.title}
              onSave={updateTitle}
              draftKey={`itinerary:${itineraryId}:title`}
              placeholder="Itinerary title"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href={`/admin/portals/${portalId}/itinerary/${itineraryId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost">Preview ↗</Button>
          </a>
          <Button onClick={() => setShowAddSection(!showAddSection)}>
            {showAddSection ? "Cancel" : "+ Add Section"}
          </Button>
        </div>
      </div>

      {/* Add Section Form */}
      {showAddSection && (
        <AddSectionForm
          itineraryId={itineraryId}
          onSaved={() => {
            setShowAddSection(false);
            fetchItinerary();
          }}
          onCancel={() => setShowAddSection(false)}
        />
      )}

      {/* Sections */}
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
            portalBounds={portalBounds}
            onChanged={fetchItinerary}
            onDelete={() => deleteSection(section.id)}
          />
        ))
      )}
    </div>
  );
}
