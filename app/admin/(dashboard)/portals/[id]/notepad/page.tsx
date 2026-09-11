"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import NotepadEntryForm from "@/components/admin/notepad/NotepadEntryForm";

interface NotepadEntry {
  id: number;
  content: string;
  tags: string | null;
  createdAt: string;
}

interface PortalMember {
  id: number;
  email: string;
  name: string | null;
}

export default function NotepadPage() {
  const params = useParams();
  const portalId = Number(params.id);

  const [entries, setEntries] = useState<NotepadEntry[]>([]);
  const [distinctTags, setDistinctTags] = useState<string[]>([]);
  const [members, setMembers] = useState<PortalMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function fetchEntries(query = "") {
    setIsLoading(true);
    const url = query
      ? `/api/portal/${portalId}/notepad?q=${encodeURIComponent(query)}`
      : `/api/portal/${portalId}/notepad`;

    const res = await fetch(url);
    const data = await res.json();
    setEntries(data.entries || []);
    setDistinctTags(data.distinctTags || []);
    setIsLoading(false);
  }

  async function fetchMembers() {
    const res = await fetch(`/api/portal/${portalId}`);
    const data = await res.json();
    // Members fetched via separate endpoint or included in portal data
    // For now, we'll handle empty state
    setMembers([]);
  }

  useEffect(() => {
    fetchEntries();
    fetchMembers();
  }, [portalId]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notepad/${id}`, { method: "DELETE" });
    fetchEntries(searchQuery);
  }

  // Build autocomplete list: member names + distinct tags
  const autocompleteSource = Array.from(new Set([
    ...members.map((m) => m.name || m.email).filter(Boolean),
    ...distinctTags,
  ]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Admin Notepad</h2>
          <p className="text-sm text-gray-500 mt-1">
            Private notes for this portal. Not visible to clients.
          </p>
        </div>
        <a href={`/admin/portals/${portalId}`}>
          <Button variant="ghost">← Back to Portal</Button>
        </a>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Guardrail:</strong> Logistics notes only (dietary needs, mobility, preferences).
          No diagnostic detail, treatment information, or medical history.
        </p>
      </Card>

      <NotepadEntryForm
        portalId={portalId}
        autocompleteSource={autocompleteSource}
        onSaved={() => fetchEntries(searchQuery)}
      />

      <Card>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchEntries(searchQuery);
            }}
            placeholder="Search notes or tags..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <Button onClick={() => fetchEntries(searchQuery)}>Search</Button>
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                fetchEntries();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            {searchQuery ? "No matching entries." : "No notes yet. Add your first one above."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                  {entry.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.split(",").map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
