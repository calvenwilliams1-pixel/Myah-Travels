"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface Person {
  id: number;
  email: string;
  canonicalName: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

export default function ClientsPeopleList() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function load(q: string = "") {
    setIsLoading(true);
    const url = q.trim()
      ? "/api/people?q=" + encodeURIComponent(q.trim())
      : "/api/people";
    const res = await fetch(url);
    const data = await res.json();
    setPeople(data.people || []);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
          Search
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              load();
            }}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </form>

      <div className="text-sm text-gray-500">{people.length} client{people.length === 1 ? "" : "s"}</div>

      {isLoading ? (
        <Card>
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        </Card>
      ) : people.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-400 text-center py-6">
            {query ? "No matching clients." : "No clients yet. Adding a portal member creates a client record."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {people.map((p) => (
            <Link
              key={p.id}
              href={"/admin/clients/" + p.id}
              className="block"
            >
              <Card className="hover:border-primary transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.canonicalName || "(no name)"}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                  </div>
                  {p.updatedAt && (
                    <span className="text-xs text-gray-400">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
