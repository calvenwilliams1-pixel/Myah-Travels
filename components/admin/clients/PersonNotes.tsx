"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Note {
  id: number;
  personId: number;
  portalId: number | null;
  content: string;
  createdAt: string | null;
}

interface PersonNotesProps {
  personId: number;
  /** When set, new notes and displayed notes are scoped to this trip. */
  portalId: number | null;
  /** Label for the section heading, e.g. "Global notes" or "Italy 2026 notes" */
  scopeLabel: string;
}

export default function PersonNotes({ personId, portalId, scopeLabel }: PersonNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    const url =
      "/api/people/" + personId + "/notes?portalId=" + (portalId === null ? "null" : portalId);
    const res = await fetch(url);
    const data = await res.json();
    setNotes(data.notes || []);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, [personId, portalId]);

  async function save() {
    if (!content.trim()) return;
    setIsSaving(true);
    await fetch("/api/people/" + personId + "/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), portalId }),
    });
    setContent("");
    setIsSaving(false);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this note?")) return;
    await fetch("/api/people/" + personId + "/notes/" + id, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{scopeLabel}</h3>

      <Card className="bg-gray-50">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post-it note — likes, dislikes, preferences, anything worth remembering."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={save} disabled={isSaving || !content.trim()}>
            {isSaving ? "Saving..." : "Add note"}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No notes yet.</p>
      ) : (
        notes.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm text-gray-800 whitespace-pre-wrap">{n.content}</p>
              <button
                onClick={() => remove(n.id)}
                className="text-red-400 hover:text-red-600 text-sm"
                aria-label="Delete note"
              >
                ✕
              </button>
            </div>
            {n.createdAt && (
              <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
