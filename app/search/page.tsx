"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface SearchResult {
  rowid: number;
  title: string;
  content: string;
  contentType: string;
  contentId: number;
  snippet: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      if (!query) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsLoading(false);
    }

    fetchResults();
  }, [query]);

  function getContentUrl(result: SearchResult): string {
    const typeMap: Record<string, string> = {
      post: "blog",
      guide: "guides",
      review: "reviews",
    };
    const base = typeMap[result.contentType];
    if (!base) return "#";
    // Placeholder: Will use slug-based routing when Segment 10 (Public Pages) is built
    return `/${base}?id=${result.contentId}`;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Search Results</h1>
      {query && (
        <p className="text-gray-600 mb-8">
          Results for: <strong>{query}</strong>
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={result.rowid} padding="md">
              <Link href={getContentUrl(result)} className="block hover:text-emerald-700">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {result.contentType}
                  </span>
                  <h2 className="text-lg font-semibold">{result.title}</h2>
                </div>
                <p className="text-sm text-gray-600">{result.snippet}</p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No results found.</p>
      )}
    </div>
  );
}
