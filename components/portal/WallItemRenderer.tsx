import React from "react";

interface WallItemProps {
  item: {
    id: number;
    sourceType: string;
    resolvedTitle: string;
    resolvedDescription: string | null;
    resolvedType: string;
    resolvedCategory: string | null;
    resolvedFilePath: string | null;
    resolvedTextContent: string | null;
    portalSlug?: string;
    itineraryId?: number | null;
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  guide: "📘",
  checklist: "☑️",
  faq: "❓",
  alert: "⚠️",
  document: "📄",
  other: "📌",
};

const TYPE_ICONS: Record<string, string> = {
  pdf: "📄",
  image: "🖼️",
  text: "📝",
  itinerary: "📋",
};

function getIcon(category: string | null, type: string): string {
  if (category && CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category];
  }
  return TYPE_ICONS[type] || "📌";
}

export default function WallItemRenderer({ item }: WallItemProps) {
  const { resolvedType, resolvedTitle, resolvedDescription, resolvedCategory, resolvedFilePath, resolvedTextContent } = item;
  const icon = getIcon(resolvedCategory, resolvedType);

  if (resolvedType === "pdf") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-semibold">{resolvedTitle}</h3>
        {resolvedDescription && (
          <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
        )}
        {resolvedFilePath && (
          <a
            href={`/uploads/${resolvedFilePath}`}
            className="inline-block mt-3 text-sm text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        )}
      </div>
    );
  }

  if (resolvedType === "image") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {resolvedFilePath && (
          <img
            src={`/uploads/${resolvedFilePath}`}
            alt={resolvedTitle}
            className="w-full h-auto"
          />
        )}
        <div className="p-4">
          <h3 className="font-semibold">
            <span className="mr-2">{icon}</span>
            {resolvedTitle}
          </h3>
          {resolvedDescription && (
            <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
          )}
        </div>
      </div>
    );
  }

  if (resolvedType === "itinerary") {
    return (
      <a
        href={`/portal/${item.portalSlug}/itinerary/${item.itineraryId}`}
        className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-primary transition-colors"
      >
        <div className="text-4xl mb-3">📋</div>
        <h3 className="font-semibold">{resolvedTitle}</h3>
        <p className="text-sm text-primary mt-2">View itinerary →</p>
      </a>
    );
  }

  // Text type
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold">
        <span className="mr-2">{icon}</span>
        {resolvedTitle}
      </h3>
      {resolvedDescription && (
        <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
      )}
      {resolvedTextContent && (
        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{resolvedTextContent}</p>
      )}
    </div>
  );
}
