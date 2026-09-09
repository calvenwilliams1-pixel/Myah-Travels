"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import AddContentModal from "@/components/admin/content-library/AddContentModal";

interface LibraryItem {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string | null;
  createdAt: string;
}

const CATEGORIES = ["all", "guide", "checklist", "faq", "alert", "document", "other"];

export default function ContentLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [category, setCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchItems() {
    setIsLoading(true);
    const url = category === "all" ? "/api/content-library" : `/api/content-library?category=${category}`;
    const res = await fetch(url);
    const data = await res.json();
    setItems(data.items || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, [category]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/content-library/${id}`, { method: "DELETE" });
    fetchItems();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Content Library</h2>
        <Button onClick={() => setShowAddModal(true)}>+ Add Content</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">No content yet. Add your first item!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{item.type}</span>
                    {item.category && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{item.category}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddContentModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
