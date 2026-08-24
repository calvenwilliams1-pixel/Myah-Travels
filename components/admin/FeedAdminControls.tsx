"use client";

import React, { useRef, useState } from "react";

interface FeedAdminControlsProps {
  postId: number;
  isPinned: boolean;
  isHighlighted: boolean;
  apiPath: string;
}

export default function FeedAdminControls({
  postId,
  isPinned,
  isHighlighted,
  apiPath,
}: FeedAdminControlsProps) {
  const [pinned, setPinned] = useState(isPinned);
  const [highlighted, setHighlighted] = useState(isHighlighted);
  const [isLoading, setIsLoading] = useState(false);
  const busyRef = useRef(false);

  const handleToggle = async (field: "isPinned" | "isHighlighted") => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsLoading(true);

    if (field === "isPinned") {
      setPinned((prev) => !prev);
    } else {
      setHighlighted((prev) => !prev);
    }

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });

      if (!res.ok) {
        throw new Error("Toggle failed");
      }

      const data = await res.json();
      setPinned(data.isPinned);
      setHighlighted(data.isHighlighted);
    } catch (err) {
      console.error("Toggle failed:", err);
      if (field === "isPinned") {
        setPinned((prev) => !prev);
      } else {
        setHighlighted((prev) => !prev);
      }
    } finally {
      busyRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleToggle("isPinned")}
        disabled={isLoading}
        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        } ${
          pinned
            ? "bg-amber-100 text-amber-800 border border-amber-300"
            : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
        }`}
        title={pinned ? "Unpin from top" : "Pin to top of feed"}
      >
        {pinned ? "📌 Pinned" : "📌 Pin"}
      </button>

      <button
        onClick={() => handleToggle("isHighlighted")}
        disabled={isLoading}
        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        } ${
          highlighted
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
            : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
        }`}
        title={highlighted ? "Remove highlight" : "Highlight in feed"}
      >
        {highlighted ? "⭐ Featured" : "⭐ Highlight"}
      </button>
    </div>
  );
}
