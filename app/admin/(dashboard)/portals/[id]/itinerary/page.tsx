"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Itinerary {
  id: number;
  title: string;
  createdAt: string;
}

export default function ItineraryListPage() {
  const params = useParams();
  const router = useRouter();
  const portalId = Number(params.id);

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function fetchItineraries() {
    const res = await fetch(`/api/portal/${portalId}/itineraries`);
    const data = await res.json();
    setItineraries(data.itineraries || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchItineraries();
  }, [portalId]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setIsCreating(true);

    const res = await fetch(`/api/portal/${portalId}/itineraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });

    const data = await res.json();
    if (data.success) {
      router.push(`/admin/portals/${portalId}/itinerary/${data.itinerary.id}`);
    }
    setIsCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this itinerary?")) return;
    await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
    fetchItineraries();
  }

  async function handleAttach(id: number) {
    const res = await fetch(`/api/itineraries/${id}/attach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portalId }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Itinerary attached to portal wall!");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Itineraries</h2>
        <div className="flex gap-3">
          <a href={`/admin/portals/${portalId}`}>
            <Button variant="ghost">← Back to Portal</Button>
          </a>
          <Button onClick={() => setShowNewForm(true)}>+ New Itinerary</Button>
        </div>
      </div>

      {showNewForm && (
        <Card>
          <h3 className="font-semibold mb-3">New Itinerary</h3>
          <div className="flex gap-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Japan Trip Oct 2026"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : itineraries.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            No itineraries yet. Create your first one!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {itineraries.map((itinerary) => (
            <Card key={itinerary.id} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{itinerary.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(itinerary.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAttach(itinerary.id)}
                  >
                    Attach to Wall
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/portals/${portalId}/itinerary/${itinerary.id}`)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(itinerary.id)}
                    className="text-red-500"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
