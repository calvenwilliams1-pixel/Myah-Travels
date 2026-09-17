"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";

interface UseAsTemplateButtonProps {
  itineraryId: number;
  itineraryTitle: string;
  portals: Array<{ id: number; name: string }>;
}

export default function UseAsTemplateButton({
  itineraryId,
  itineraryTitle,
  portals,
}: UseAsTemplateButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [targetPortalId, setTargetPortalId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useFocusRestore(isOpen);

  function open() {
    setIsOpen(true);
    setNewTitle(itineraryTitle + " (copy)");
    if (portals.length > 0) setTargetPortalId(portals[0].id);
  }

  async function submit() {
    if (!targetPortalId) {
      setError("Choose a portal");
      return;
    }
    if (!newTitle.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch("/api/itineraries/" + itineraryId + "/duplicate-to-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portalId: targetPortalId, title: newTitle.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsOpen(false);
    // Navigate to the new itinerary editor
    router.push("/admin/portals/" + targetPortalId + "/itinerary/" + data.itinerary.id);
  }

  if (!isOpen) {
    return (
      <Button variant="secondary" size="sm" onClick={open}>
        Use as template
      </Button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="use-as-template-title"
    >
      <div className="bg-white rounded-lg p-5 max-w-md w-full">
        <h3 id="use-as-template-title" className="font-semibold mb-3">Use as template</h3>
        <p className="text-sm text-gray-500 mb-4">
          Creates a fresh copy in the target portal. Structure, segments, and stays carry over. Dates and booking references do not.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Target portal</label>
        <select
          value={targetPortalId ?? ""}
          onChange={(e) => setTargetPortalId(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
        >
          {portals.length === 0 && <option value="">No portals available</option>}
          {portals.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <label className="block text-sm font-medium text-gray-700 mb-1">New itinerary title</label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isSaving || !targetPortalId || !newTitle.trim()}>
            {isSaving ? "Copying..." : "Create copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
