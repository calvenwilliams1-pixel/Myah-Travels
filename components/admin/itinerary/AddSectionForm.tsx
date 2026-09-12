"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddSectionFormProps {
  itineraryId: number;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddSectionForm({
  itineraryId,
  onSaved,
  onCancel,
}: AddSectionFormProps) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setIsSaving(true);

    await fetch(`/api/itineraries/${itineraryId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    setIsSaving(false);
    onSaved();
  }

  return (
    <Card>
      <h3 className="font-semibold mb-3">New Section</h3>
      <Input
        label="Section Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Japan Pre-Cruise"
        helperText="A short name for this part of the trip (e.g., Japan, Cruise, Singapore)"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
      />
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
          {isSaving ? "Creating..." : "Create Section"}
        </Button>
      </div>
    </Card>
  );
}
