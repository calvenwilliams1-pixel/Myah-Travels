"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { buildPublicUrl } from "@/lib/media/url";

interface MediaItem {
  id: number;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  altText: string | null;
  caption: string | null;
  isLibrary: boolean;
  uploadedAt: string;
}

interface MediaLibraryPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

type Scope = "library" | "all";

export default function MediaLibraryPicker({ onSelect, onClose }: MediaLibraryPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [scope, setScope] = useState<Scope>("library");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStars, setPendingStars] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (!dlg.open) dlg.showModal();
    const handleClose = () => onClose();
    dlg.addEventListener("close", handleClose);
    return () => {
      dlg.removeEventListener("close", handleClose);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [onClose]);

  const fetchPage = useCallback(
    async (params: { scope: Scope; q: string; offset: number }, append: boolean) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/media", window.location.origin);
        url.searchParams.set("scope", params.scope);
        if (params.q) url.searchParams.set("q", params.q);
        url.searchParams.set("limit", "24");
        url.searchParams.set("offset", String(params.offset));

        const res = await fetch(url.toString(), { signal: ctrl.signal });
        if (!res.ok) {
          setError(`Failed to load (${res.status})`);
          return;
        }
        const data = await res.json();
        const newItems: MediaItem[] = data.items || [];

        setTotal(data.total ?? 0);
        if (append) {
          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            return [...prev, ...newItems.filter((i) => !seen.has(i.id))];
          });
        } else {
          setItems(newItems);
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError("Network error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const fetchSavedTotal = useCallback(async () => {
    try {
      const res = await fetch("/api/media?scope=library&limit=1&offset=0");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.total ?? 0;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    if (initialized) return;
    (async () => {
      const saved = await fetchSavedTotal();
      setSavedTotal(saved);
      if (saved === 0) {
        setScope("all");
        setShowHint(true);
        fetchPage({ scope: "all", q: "", offset: 0 }, false);
      } else {
        fetchPage({ scope: "library", q: "", offset: 0 }, false);
      }
      setInitialized(true);
    })();
  }, [initialized, fetchPage, fetchSavedTotal]);

  useEffect(() => {
    if (!initialized) return;
    const t = setTimeout(() => {
      fetchPage({ scope, q, offset: 0 }, false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, scope, initialized, fetchPage]);

  async function toggleStar(item: MediaItem) {
    if (pendingStars.has(item.id)) return;
    setPendingStars((prev) => new Set(prev).add(item.id));

    const next = !item.isLibrary;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isLibrary: next } : i)));
    setSavedTotal((prev) => prev + (next ? 1 : -1));

    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLibrary: next }),
      });
      if (!res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isLibrary: !next } : i)));
        setSavedTotal((prev) => prev + (next ? -1 : 1));
      }
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isLibrary: !next } : i)));
      setSavedTotal((prev) => prev + (next ? -1 : 1));
    } finally {
      setPendingStars((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  function handleSelect(item: MediaItem) {
    onSelect(buildPublicUrl(item.filePath));
    dialogRef.current?.close();
  }

  function handleLoadMore() {
    fetchPage({ scope, q, offset: items.length }, true);
  }

  const hasMore = items.length < total;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto p-0 rounded-lg bg-white shadow-xl max-w-3xl w-full max-h-[85vh]"
      style={{ border: "none" }}
    >
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScope("library")}
              className={`text-sm px-3 py-1 rounded ${
                scope === "library" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Saved
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`text-sm px-3 py-1 rounded ${
                scope === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All uploads
            </button>
            <span className="ml-2 text-xs text-gray-500">{savedTotal} saved</span>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-2 border-b border-gray-200">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by filename…"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
        </div>

        {showHint && scope === "all" && savedTotal === 0 && (
          <div className="px-4 py-2 bg-blue-50 text-xs text-blue-700 border-b border-blue-100">
            Nothing saved yet — star files here to save them to your library.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {scope === "library" ? "Nothing saved yet." : "No files match."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const url = buildPublicUrl(item.filePath);
                const starred = item.isLibrary;
                const pending = pendingStars.has(item.id);
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="block w-full aspect-square rounded overflow-hidden border border-gray-200 hover:border-primary bg-gray-50"
                      aria-label={`Select ${item.fileName}`}
                    >
                      <img
                        src={url}
                        alt={item.altText || item.fileName || ""}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStar(item)}
                      disabled={pending}
                      aria-pressed={starred}
                      aria-label={`${starred ? "Remove" : "Save"} ${item.fileName} ${starred ? "from" : "to"} library`}
                      className={`absolute top-1 right-1 text-lg leading-none px-1 rounded ${
                        starred ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                      } ${pending ? "opacity-50" : ""}`}
                    >
                      {starred ? "★" : "☆"}
                    </button>
                    <p className="text-[10px] text-gray-500 truncate mt-1" title={item.fileName || ""}>
                      {item.fileName || "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasMore && !loading && (
          <div className="border-t border-gray-200 px-4 py-2 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : `Load more (${items.length} of ${total})`}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
