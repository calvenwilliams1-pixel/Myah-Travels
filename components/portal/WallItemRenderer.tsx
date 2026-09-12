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
  mode?: "client" | "admin-preview";
  portalId?: number;
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

export default function WallItemRenderer({
  item,
  mode = "client",
  portalId,
}: WallItemProps) {
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
    const href =
      mode === "admin-preview" && portalId
        ? `/admin/portals/${portalId}/itinerary/${item.itineraryId}/preview`
        : `/portal/${item.portalSlug}/itinerary/${item.itineraryId}`;

    return (
      <a
        href={href}
        className="group relative flex flex-col bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📋</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Itinerary
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3">
          {resolvedTitle}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-600">
            Multi-day trip · Full details
          </span>
          <span className="text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
            View →
          </span>
        </div>
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
