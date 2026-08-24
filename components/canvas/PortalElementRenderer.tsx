import React from "react";
import { CanvasElement, PortalRuntimeData } from "@/types/canvas";

interface PortalElementRendererProps {
  element: CanvasElement;
  portalData: PortalRuntimeData;
}

export default function PortalElementRenderer({ element, portalData }: PortalElementRendererProps) {
  switch (element.type) {
    case "portal_dates": {
      const data = element.portalDatesData || {
        showDeparture: true,
        showReturn: true,
        showCountdown: true,
        label: "Trip Dates",
      };
      
      return (
        <div className="w-full h-full overflow-auto bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-bold text-blue-800 mb-2">{data.label}</p>
          {data.showDeparture && portalData.departureDate && (
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Departure:</span>{" "}
              {new Date(portalData.departureDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {data.showReturn && portalData.returnDate && (
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Return:</span>{" "}
              {new Date(portalData.returnDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {data.showCountdown && portalData.departureDate && (
            <p className="text-sm text-blue-700 mt-2">
              <span className="font-semibold">Countdown:</span>{" "}
              {Math.max(
                0,
                Math.ceil(
                  (new Date(portalData.departureDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              )}{" "}
              days
            </p>
          )}
        </div>
      );
    }

    case "portal_notices": {
      const data = element.portalNoticesData || {
        maxItems: 5,
        showPinnedOnly: false,
        showGlobalAnnouncements: true,
        title: "Notices",
      };
      
      let notices = portalData.notices || [];
      if (data.showPinnedOnly) {
        notices = notices.filter((n) => n.isPinned);
      }
      if (!data.showGlobalAnnouncements) {
        notices = notices.filter((n) => !n.isGlobalAnnouncement);
      }
      notices = notices.slice(0, Math.max(0, data.maxItems));

      return (
        <div className="w-full h-full overflow-auto bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-bold text-amber-800 mb-2">{data.title}</p>
          {notices.length === 0 ? (
            <p className="text-xs text-amber-600">No notices yet</p>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white rounded p-2 border border-amber-100"
                >
                  <p className="text-sm font-semibold text-amber-900">
                    {notice.isPinned && "📌 "}
                    {notice.isGlobalAnnouncement && "🌍 "}
                    {notice.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                    {notice.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "portal_documents": {
      const data = element.portalDocumentsData || {
        maxItems: 10,
        showFileType: true,
        title: "Documents",
      };
      
      const documents = (portalData.documents || []).slice(0, Math.max(0, data.maxItems));

      return (
        <div className="w-full h-full overflow-auto bg-green-50 rounded-lg p-4">
          <p className="text-sm font-bold text-green-800 mb-2">{data.title}</p>
          {documents.length === 0 ? (
            <p className="text-xs text-green-600">No documents yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white rounded p-2 border border-green-100 hover:bg-green-100 transition-colors"
                >
                  <span>📄</span>
                  <span className="text-sm text-green-900 flex-1">{doc.title}</span>
                  {data.showFileType && (
                    <span className="text-xs text-gray-500 uppercase">
                      {doc.fileType}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "portal_faqs": {
      const data = element.portalFaqsData || {
        maxItems: 10,
        title: "FAQs",
      };
      
      const faqs = (portalData.faqs || []).slice(0, Math.max(0, data.maxItems));

      return (
        <div className="w-full h-full overflow-auto bg-purple-50 rounded-lg p-4">
          <p className="text-sm font-bold text-purple-800 mb-2">{data.title}</p>
          {faqs.length === 0 ? (
            <p className="text-xs text-purple-600">No FAQs yet</p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.id}
                  className="bg-white rounded border border-purple-100"
                >
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-purple-900">
                    {faq.question}
                  </summary>
                  <p className="px-3 pb-2 text-xs text-gray-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
