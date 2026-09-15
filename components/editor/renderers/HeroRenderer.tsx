import React from "react";
import { HeroData, HeroSize, TemplateStyle } from "@/types/blocks";

interface HeroRendererProps {
  data: HeroData;
  style: TemplateStyle;
}

// Size -> CSS height. When a block has no explicit size (backward compat),
// fall back to the template's style.heroHeight.
const SIZE_HEIGHTS: Record<HeroSize, string> = {
  banner: "160px",
  medium: "320px",
  large: "480px",
  fullscreen: "min(85vh, 720px)",
};

export default function HeroRenderer({ data, style }: HeroRendererProps) {
  const size: HeroSize = data.size ?? "large";
  const height = SIZE_HEIGHTS[size] ?? style.heroHeight;

  const hasOverlay = !!(data.overlayTitle || data.overlaySubtitle || data.overlayCaption);

  return (
    <div
      style={{
        position: "relative",
        height,
        borderRadius: style.heroBorderRadius,
        margin: style.heroMargin,
        overflow: "hidden",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt={data.alt || "Hero image"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
      ) : (
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>
          Hero image
        </span>
      )}

      {/* Gradient scrim for overlay readability */}
      {hasOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0) 70%)",
          }}
        />
      )}

      {/* Overlay text */}
      {hasOverlay && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "24px",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            zIndex: 1,
          }}
        >
          {data.overlayTitle && (
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1.2,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                fontFamily: style.fontFamily,
              }}
            >
              {data.overlayTitle}
            </h2>
          )}
          {data.overlaySubtitle && (
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                opacity: 0.92,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                fontFamily: style.fontFamily,
              }}
            >
              {data.overlaySubtitle}
            </p>
          )}
          {data.overlayCaption && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                opacity: 0.75,
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                fontFamily: style.fontFamily,
              }}
            >
              {data.overlayCaption}
            </p>
          )}
        </div>
      )}

      {/* Caption (below image — separate from overlay) */}
      {data.caption && !hasOverlay && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 12px",
            background: "rgba(0,0,0,0.5)",
            color: "#ffffff",
            fontSize: "12px",
            fontFamily: style.fontFamily,
            zIndex: 1,
          }}
        >
          {data.caption}
        </div>
      )}
    </div>
  );
}
