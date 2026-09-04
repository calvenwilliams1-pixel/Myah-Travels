import React from "react";
import { GalleryData, TemplateStyle } from "@/types/blocks";

interface GalleryRendererProps {
  data: GalleryData;
  style: TemplateStyle;
}

export default function GalleryRenderer({ data, style }: GalleryRendererProps) {
  if (data.images.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#9ca3af",
          border: "1px dashed #d1d5db",
          borderRadius: style.galleryBorderRadius,
          margin: style.galleryMargin,
          fontFamily: style.fontFamily,
        }}
      >
        Gallery placeholder
      </div>
    );
  }

  const gridCols =
    data.images.length === 1
      ? "1fr"
      : data.images.length === 2
      ? "repeat(2, 1fr)"
      : "repeat(auto-fill, minmax(150px, 1fr))";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        gap: style.galleryGap,
        margin: style.galleryMargin,
      }}
    >
      {data.images.map((img, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <img
            src={img.url}
            alt={img.caption || "Gallery image " + (i + 1)}
            style={{
              width: "100%",
              height: style.galleryImageHeight,
              objectFit: "cover",
              borderRadius: style.galleryBorderRadius,
            }}
          />
          {img.caption && (
            <figcaption
              style={{
                fontSize: "12px",
                color: style.bodyColor,
                marginTop: "4px",
                fontFamily: style.fontFamily,
              }}
            >
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
