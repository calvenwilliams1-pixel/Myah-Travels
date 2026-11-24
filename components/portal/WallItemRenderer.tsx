import React from "react";
import DOMPurify from "isomorphic-dompurify";
import { PURIFY_CONFIG } from "@/lib/editor/extensions";
import DocumentViewer from "./DocumentViewer";

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
    // "pdf" is the uploaded-document type generally: PDFs and plain
    // text read right here in the portal; Office files (Word, Excel)
    // can't render in a browser, so those stay download-to-open.
    const ext = (resolvedFilePath ?? "").split(".").pop()?.toLowerCase() ?? "";
    const embeddable = ext === "pdf" || ext === "txt";
    const fileUrl = resolvedFilePath ? `/api/uploads/${resolvedFilePath}` : null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-semibold">{resolvedTitle}</h3>
        {resolvedDescription && (
          <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
        )}
        {!embeddable && fileUrl && (
          <p className="text-xs text-gray-500 mt-1">
            {ext === "doc" || ext === "docx" ? "Word document" : "Office document"} — download to open.
          </p>
        )}
        {fileUrl && (
          <div className="flex items-center gap-4">
            {embeddable && (
              <DocumentViewer title={resolvedTitle} url={fileUrl} kind="embed" triggerLabel="View" />
            )}
            <a
              href={fileUrl}
              download
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              Download
            </a>
          </div>
        )}
      </div>
    );
  }

  if (resolvedType === "image") {
    const fileUrl = resolvedFilePath ? `/api/uploads/${resolvedFilePath}` : null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {fileUrl && (
          <img
            src={fileUrl}
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
          {fileUrl && (
            <DocumentViewer title={resolvedTitle} url={fileUrl} kind="image" triggerLabel="Enlarge" />
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
            Full Itinerary
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-3">
          {resolvedTitle}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-600">
            Complete day-by-day document
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
      {resolvedTextContent &&
        (/<\/?(p|h[1-6]|ul|ol|li|strong|em|b|i|a|br|blockquote|div|span)\b/i.test(resolvedTextContent) ? (
          // Written in the rich text editor: render the formatting,
          // sanitized with the same rules as every other renderer.
          <div
            className="prose prose-sm max-w-none mt-2 text-gray-800"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(resolvedTextContent, PURIFY_CONFIG),
            }}
          />
        ) : (
          <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{resolvedTextContent}</p>
        ))}
    </div>
  );
}
