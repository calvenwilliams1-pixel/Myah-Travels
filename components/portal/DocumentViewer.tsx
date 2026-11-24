"use client";

import React, { useEffect, useRef, useState } from "react";

interface DocumentViewerProps {
  title: string;
  /** Same-origin URL of the file (uploads route serves it inline). */
  url: string;
  /** pdf/txt render embedded; image renders blown up. */
  kind: "embed" | "image";
  triggerLabel?: string;
}

/**
 * In-portal document viewer: a full-screen overlay so clients can
 * READ a document where they found it — no download required. The
 * embedded PDF view is the browser's own (scroll, zoom and its own
 * print), and the header adds explicit Print and Download actions.
 */
export default function DocumentViewer({ title, url, kind, triggerLabel = "View" }: DocumentViewerProps) {
  const [open, setOpen] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  function handlePrint() {
    if (kind === "embed" && frameRef.current?.contentWindow) {
      try {
        frameRef.current.contentWindow.focus();
        frameRef.current.contentWindow.print();
        return;
      } catch {
        // Cross-browser quirks: fall through to opening the file,
        // where the browser's own viewer prints reliably.
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex items-center gap-2 bg-white px-4 py-3 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 truncate flex-1">{title}</h3>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90"
            >
              Print
            </button>
            <a
              href={url}
              download
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Download
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close viewer"
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
            {kind === "embed" ? (
              <iframe
                ref={frameRef}
                src={url}
                title={title}
                className="w-full h-full bg-white rounded shadow"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-start justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={title} className="max-w-full h-auto rounded shadow" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
