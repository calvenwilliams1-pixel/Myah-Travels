"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StaleEntity {
  id: number;
  kind: string;
  canonicalName: string;
  useCount: number;
  lastUsedAt: string;
}

export default function StaleEntitiesPage() {
  const [entities, setEntities] = useState<StaleEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/suggestions/entities/stale");
    const data = await res.json();
    setEntities(data.entities || []);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this entity? It will no longer appear in autocomplete.")) return;
    setIsDeleting(id);
    await fetch("/api/suggestions/entities/" + id, { method: "DELETE" });
    setIsDeleting(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Stale Entities</h2>
        <p className="text-sm text-gray-500">
          Entities used exactly once and not touched in 90+ days. Safe to delete — deleting an entity only removes a future suggestion; it never affects existing itineraries.
        </p>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-gray-500 py-6 text-center">Loading...</p>
        ) : entities.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-6 text-center">
            Nothing stale — every entity has been used at least twice or has been touched recently.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Kind</th>
                <th className="text-left py-2 font-medium text-gray-600">Name</th>
                <th className="text-left py-2 font-medium text-gray-600">Last used</th>
                <th className="text-right py-2 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">{e.kind}</td>
                  <td className="py-2">{e.canonicalName}</td>
                  <td className="py-2 text-gray-500">{e.lastUsedAt.slice(0, 10)}</td>
                  <td className="py-2 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => remove(e.id)}
                      disabled={isDeleting === e.id}
                    >
                      {isDeleting === e.id ? "..." : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
