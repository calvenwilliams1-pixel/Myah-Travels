import React from "react";
import { CanvasDocument, PortalRuntimeData } from "@/types/canvas";
import PortalElementRenderer from "@/components/canvas/PortalElementRenderer";

interface CanvasRendererProps {
  document: CanvasDocument;
  portalData?: PortalRuntimeData;
}

function sanitizeUrl(url: string | undefined): string {
  if (!url) return "#";
  const safe = url.trim().toLowerCase();
  if (
    safe.startsWith("http://") ||
    safe.startsWith("https://") ||
    safe.startsWith("mailto:") ||
    safe.startsWith("tel:") ||
    safe.startsWith("/") ||
    safe.startsWith("#")
  ) {
    return url;
  }
  return "#";
}

export default function CanvasRenderer({ document, portalData }: CanvasRendererProps) {
  const sortedElements = [...document.elements]
    .filter((el) => el.visible !== false)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  return (
    <div className="overflow-auto">
      <div
        className="canvas-wrapper relative"
        style={{
          width: document.canvas.width,
          height: document.canvas.height,
          background: document.canvas.background || "#ffffff",
        }}
      >
        {sortedElements.map((el) => {
          const baseStyle: React.CSSProperties = {
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: `rotate(${el.rotation || 0}deg)`,
            zIndex: el.zIndex,
          };

          switch (el.type) {
            case "text":
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    fontSize: el.fontSize || 16,
                    color: el.color || "#333333",
                    fontFamily: el.fontFamily || "Inter",
                    textAlign: el.textAlign || "left",
                    fontWeight: el.fontWeight || "normal",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    overflow: "hidden",
                  }}
                >
                  {el.text || ""}
                </div>
              );

            case "image":
              if (!el.src && !el.assetId) return null;
              return (
                <img
                  key={el.id}
                  src={el.src || `/api/assets/${el.assetId}`}
                  alt={el.altText || ""}
                  loading="lazy"
                  style={{
                    ...baseStyle,
                    objectFit: el.objectFit || "cover",
                    borderRadius: el.borderRadius || 0,
                  }}
                />
              );

            case "shape":
              return (
                <div
                  key={el.id}
                  aria-hidden="true"
                  style={{
                    ...baseStyle,
                    backgroundColor: el.fillColor || "#e8b84b",
                    border: `${el.borderWidth || 0}px solid ${el.borderColor || "transparent"}`,
                    borderRadius:
                      el.shapeType === "circle"
                        ? "50%"
                        : el.shapeType === "square"
                        ? el.borderRadius || 0
                        : el.borderRadius || 0,
                    opacity: el.opacity ?? 1,
                  }}
                />
              );

            case "divider":
              return (
                <div
                  key={el.id}
                  aria-hidden="true"
                  style={{
                    ...baseStyle,
                    height: el.thickness || 2,
                    backgroundColor: el.color || "#cccccc",
                  }}
                />
              );

            case "button": {
              const safeLink = sanitizeUrl(el.link);
              const isExternal =
                safeLink.startsWith("http://") ||
                safeLink.startsWith("https://");
              return (
                <a
                  key={el.id}
                  href={safeLink}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  aria-label={el.text || "Learn More"}
                  style={{
                    ...baseStyle,
                    backgroundColor: el.backgroundColor || "#4a7c59",
                    color: el.textColor || "#ffffff",
                    borderRadius: el.borderRadius || 8,
                    fontSize: el.fontSize || 16,
                    fontWeight: el.fontWeight || "normal",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    overflow: "hidden",
                  }}
                >
                  {el.text || "Learn More"}
                </a>
              );
            }

            case "list": {
              const items = Array.isArray(el.items) ? (el.items as string[]) : [];
              const listStyle =
                el.listType === "numbered" ? "decimal" : (el.bulletStyle || "disc");
              return (
                <ul
                  key={el.id}
                  style={{
                    ...baseStyle,
                    listStyleType: listStyle,
                    paddingLeft: 20,
                    overflow: "auto",
                  }}
                >
                  {items.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: el.fontSize || 16,
                        color: el.color || "#333333",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }

            case "checklist": {
              const checklistItems = Array.isArray(el.items)
                ? (el.items as { id: string; text: string; checked: boolean }[])
                : [];
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    overflow: "auto",
                  }}
                >
                  <div className="space-y-1">
                    {checklistItems.map((item, index) => (
                      <div
                        key={item.id || `${el.id}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: el.fontSize || 16,
                          color: el.color || "#333333",
                        }}
                      >
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            border: "1px solid #999",
                            borderRadius: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            backgroundColor: item.checked ? "#4a7c59" : "transparent",
                            color: item.checked ? "#ffffff" : "transparent",
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span
                          style={{
                            textDecoration: item.checked ? "line-through" : "none",
                            opacity: item.checked ? 0.6 : 1,
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            case "proscons": {
              const pros = Array.isArray(el.pros) ? (el.pros as string[]) : [];
              const cons = Array.isArray(el.cons) ? (el.cons as string[]) : [];
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    overflow: "auto",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#4a7c59",
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      PROS
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {pros.map((pro, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: el.fontSize || 16,
                            color: el.color || "#333333",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#dc2626",
                        margin: 0,
                        marginBottom: 4,
                      }}
                    >
                      CONS
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {cons.map((con, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: el.fontSize || 16,
                            color: el.color || "#333333",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            }

            case "pdf": {
              if (!el.src && !el.assetId) return null;
              const fileUrl = el.src || `/api/assets/${el.assetId}`;

              if (el.displayMode === "download") {
                return (
                  <a
                    key={el.id}
                    href={fileUrl}
                    download
                    style={{
                      ...baseStyle,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f9f9f9",
                      border: "2px solid #e5e5e5",
                      borderRadius: 8,
                      textDecoration: "none",
                      color: "#333",
                    }}
                  >
                    <span style={{ fontSize: 32 }}>📄</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {el.fileName || "Download PDF"}
                    </span>
                    <span style={{ fontSize: 12, color: "#4a7c59" }}>
                      Click to Download
                    </span>
                  </a>
                );
              }

              if (el.displayMode === "full") {
                return (
                  <iframe
                    key={el.id}
                    src={`${fileUrl}#toolbar=0`}
                    title={el.fileName || "PDF Viewer"}
                    style={{
                      ...baseStyle,
                      border: "none",
                      borderRadius: 8,
                      backgroundColor: "#f9f9f9",
                    }}
                  />
                );
              }

              return (
                <a
                  key={el.id}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...baseStyle,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f9f9f9",
                    border: "2px solid #e5e5e5",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "#333",
                  }}
                >
                  <span style={{ fontSize: 32 }}>📄</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {el.fileName || "PDF Document"}
                  </span>
                  <span style={{ fontSize: 12, color: "#999" }}>
                    Click to view
                  </span>
                </a>
              );
            }

            case "portal_dates":
            case "portal_notices":
            case "portal_documents":
            case "portal_faqs":
              return (
                <div key={el.id} style={baseStyle}>
                  <PortalElementRenderer
                    element={el}
                    portalData={portalData || {}}
                  />
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
