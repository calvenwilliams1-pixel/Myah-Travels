import React from "react";
import { CalloutData, TemplateStyle } from "@/types/blocks";

interface CalloutRendererProps {
  data: CalloutData;
  style: TemplateStyle;
}

const VARIANT_ICONS = {
  tip: "💡",
  warning: "⚠️",
  info: "ℹ️",
};

export default function CalloutRenderer({ data, style }: CalloutRendererProps) {
  return (
    <div
      style={{
        backgroundColor: style.calloutBackground,
        borderLeft: `4px solid ${style.calloutBorder}`,
        padding: "12px 16px",
        borderRadius: "8px",
        margin: "16px 0",
        fontFamily: style.fontFamily,
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span>{VARIANT_ICONS[data.variant]}</span>
        <span style={{ color: style.calloutTextColor }}>
          {data.text || "Empty callout"}
        </span>
      </div>
    </div>
  );
}
