"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import AutosaveTextField from "@/components/ui/autosave/AutosaveTextField";
import AutocompleteField from "@/components/ui/AutocompleteField";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";
import AutosaveDateField from "@/components/ui/autosave/AutosaveDateField";
import AddStayForm from "./AddStayForm";
import ThemeSelector from "./ThemeSelector";
import StaysEditor from "./StaysEditor";
import AddDayForm from "./AddDayForm";
import DaysEditor from "./DaysEditor";
import type { Section, PortalBounds } from "./ItineraryEditor";

interface SectionEditorProps {
  section: Section;
  portalBounds: PortalBounds;
  onChanged: () => void;
  onDelete: () => void;
}

export default function SectionEditor({
  section,
  portalBounds,
  onChanged,
  onDelete,
}: SectionEditorProps) {
  const [showAddStay, setShowAddStay] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);

  async function updateSection(data: Partial<Section>) {
    await fetch(`/api/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  return (
    <Card className="space-y-4">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <AutosaveTextField
            value={section.title}
            onSave={(v) => updateSection({ title: v })}
            draftKey={`section:${section.id}:title`}
            placeholder="Section title"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500"
        >
          Delete Section
        </Button>
      </div>

      {/* Base city */}
      <AutocompleteField
        label="Base City"
        value={section.baseCity || ""}
        onSave={(v) => updateSection({ baseCity: v })}
        draftKey={`section:${section.id}:baseCity`}
        placeholder="Yokohama"
        helperText="The main city you're staying in for this part of the trip"
        fieldKey={FIELD_KEYS.SECTION_BASE_CITY}
        entityKind="city"
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <AutosaveDateField
          label="Start Date"
          value={section.startDate || ""}
          onSave={(v) => updateSection({ startDate: v })}
          draftKey={`section:${section.id}:startDate`}
          min={portalBounds.departureDate || undefined}
          max={portalBounds.returnDate || undefined}
          helperText={
            portalBounds.departureDate
              ? `On or after ${portalBounds.departureDate}`
              : undefined
          }
        />
        <AutosaveDateField
          label="End Date"
          value={section.endDate || ""}
          onSave={(v) => updateSection({ endDate: v })}
          draftKey={`section:${section.id}:endDate`}
          min={section.startDate || portalBounds.departureDate || undefined}
          max={portalBounds.returnDate || undefined}
          helperText={
            portalBounds.returnDate
              ? `On or before ${portalBounds.returnDate}`
              : undefined
          }
        />
      </div>

      {/* Theme override */}
      <ThemeSelector
        label="Section Theme (optional)"
        value={section.themePresetOverride ?? null}
        onChange={(v) => {
          updateSection({ themePresetOverride: v });
          onChanged();
        }}
        inheritLabel="Inherit itinerary theme"
        helperText="Leave on inherit unless this section needs a different look."
      />

      {/* Stays */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700">Stays</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddStay(!showAddStay)}
          >
            {showAddStay ? "Cancel" : "+ Add Stay"}
          </Button>
        </div>

        {showAddStay && (
          <AddStayForm
            sectionId={section.id}
            sectionStartDate={section.startDate}
            sectionEndDate={section.endDate}
            onSaved={() => {
              setShowAddStay(false);
              onChanged();
            }}
            onCancel={() => setShowAddStay(false)}
          />
        )}

        <StaysEditor
          sectionId={section.id}
          stays={section.stays}
          onChanged={onChanged}
        />
      </div>

      {/* Days */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700">Days</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const res = await fetch(`/api/sections/${section.id}/extend-day`, { method: "POST" });
                if (res.ok) onChanged();
              }}
              title="Add a new day at the end of this section"
            >
              Extend by 1 day
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddDay(!showAddDay)}
            >
              {showAddDay ? "Cancel" : "+ Add Day"}
            </Button>
          </div>
        </div>

        {showAddDay && (
          <AddDayForm
            sectionId={section.id}
            nextDayNumber={section.days.length + 1}
            sectionStartDate={section.startDate}
            sectionEndDate={section.endDate}
            onSaved={() => {
              setShowAddDay(false);
              onChanged();
            }}
            onCancel={() => setShowAddDay(false)}
          />
        )}

        <DaysEditor
          sectionId={section.id}
          days={section.days}
          onChanged={onChanged}
          itineraryId={section.itineraryId}
        />
      </div>
    </Card>
  );
}
