"use client";

import React, { useState } from "react";

interface PortalItem {
  id: number;
  sourceType: string;
  resolvedTitle: string;
  resolvedType: string;
  resolvedCategory: string | null;
  position: number;
}

interface PortalItemsListProps {
  portalId: number;
  items: PortalItem[];
  onChanged: () => void;
}

export default function PortalItemsList({ portalId, items, onChanged }: PortalItemsListProps) {
  const [orderedItems, setOrderedItems] = useState(items);

  async function moveItem(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedItems.length) return;

    const updated = [...orderedItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setOrderedItems(updated);

    // Persist order
    await fetch(`/api/portal/${portalId}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: updated.map((i) => i.id) }),
    });
  }

  async function removeItem(itemId: number) {
    if (!confirm("Remove this item from the portal?")) return;

    await fetch(`/api/portal/${portalId}/items/${itemId}`, { method: "DELETE" });
    onChanged();
  }

  if (orderedItems.length === 0) {
    return <p className="text-gray-500 text-center py-8">No content attached yet.</p>;
  }

  return (
    <div className="space-y-2">
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => moveItem(index, "up")}
              disabled={index === 0}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => moveItem(index, "down")}
              disabled={index === orderedItems.length - 1}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
          </div>

          <div className="flex-1">
            <p className="font-medium">{item.resolvedTitle}</p>
            <p className="text-xs text-gray-500">
              {item.resolvedType} · {item.resolvedCategory || "no category"} ·{" "}
              {item.sourceType === "library" ? "Library" : "Portal-specific"}
            </p>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="text-red-500 hover:text-red-700 text-sm"
            aria-label="Remove item"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
