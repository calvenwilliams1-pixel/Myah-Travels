import React from "react";
import { QuickFactsData, TemplateStyle } from "@/types/blocks";

interface QuickFactsRendererProps {
  data: QuickFactsData;
  style: TemplateStyle;
}

export default function QuickFactsRenderer({ data, style }: QuickFactsRendererProps) {
  return (
    <div
      style={{
        backgroundColor: style.quickFactsBackground,
        border: "1px solid " + style.quickFactsBorder,
        padding: style.quickFactsPadding,
        borderRadius: style.quickFactsBorderRadius,
        margin: style.quickFactsMargin,
        fontFamily: style.fontFamily,
      }}
    >
      {data.facts.length === 0 ? (
        <p style={{ color: "#9ca3af", textAlign: "center", margin: 0 }}>
          No facts added yet
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {data.facts.map((fact, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < data.facts.length - 1
                      ? "1px solid " + style.quickFactsBorder
                      : "none",
                }}
              >
                <td
                  style={{
                    padding: "10px 16px 10px 0",
                    fontWeight: 600,
                    color: style.quickFactsLabelColor,
                    whiteSpace: "nowrap",
                    verticalAlign: "top",
                    fontSize: "14px",
                  }}
                >
                  {fact.label}
                </td>
                <td
                  style={{
                    padding: "10px 0",
                    color: style.quickFactsValueColor,
                    fontSize: "14px",
                  }}
                >
                  {fact.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
