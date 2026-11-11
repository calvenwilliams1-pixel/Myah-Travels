"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import FeedContainer from "./FeedContainer";
import { FeedItem } from "./types";

interface InfiniteFeedProps {
  initialItems: FeedItem[];
  selectedType: string;
  selectedSort: string;
}

const PAGE_SIZE = 10;
const LOAD_MORE_THRESHOLD = 600;

export default function InfiniteFeed({
  initialItems,
  selectedType,
  selectedSort,
}: InfiniteFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [hasMore, setHasMore] = useState(initialItems.length >= PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set("type", selectedType);
    params.set("sort", selectedSort);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();
      const newItems = data.items || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => [...prev, ...newItems]);
        setOffset((prev) => prev + newItems.length);
        setHasMore(newItems.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, offset, selectedType, selectedSort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: `${LOAD_MORE_THRESHOLD}px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <FeedContainer items={items} />
      <div ref={sentinelRef} className="h-10" />
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading more...</p>
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">You've reached the end 🎉</p>
        </div>
      )}
    </div>
  );
}
