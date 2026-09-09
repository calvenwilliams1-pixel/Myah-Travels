"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface AttachLibraryModalProps {
  portalId: number;
  onClose: () => void;
  onAttached: () => void;
}

interface LibraryItem {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string | null;
}

export default function AttachLibraryModal({ portalId, onClose, onAttached }: AttachLibraryModalProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAttaching, setIsAttaching] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      const res = await fetch("/api/content-library");
      const data = await res.json();
      setItems(data.items || []);
      setIsLoading(false);
    }
    fetchItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggleItem(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleAttach() {
    setIsAttaching(true);

    for (const id of selectedIds) {
      await fetch(`/api/portal/${portalId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentLibraryId: id }),
      });
    }

    setIsAttaching(false);
    onAttached();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Attach from Library</h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        />

        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {filteredItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.type} · {item.category || "no category"}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAttach} disabled={selectedIds.length === 0 || isAttaching}>
            {isAttaching ? "Attaching..." : `Attach Selected (${selectedIds.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
