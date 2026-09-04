import React from "react";
import { QuoteData, TemplateStyle } from "@/types/blocks";

interface QuoteRendererProps {
  data: QuoteData;
  style: TemplateStyle;
}

export default function QuoteRenderer({ data, style }: QuoteRendererProps) {
  if (!data.text) return null;

  return (
    <blockquote
      style={{
        backgroundColor: style.quoteBackground,
        borderLeft: "4px solid " + style.quoteBorderColor,
        padding: style.quotePadding,
        margin: style.quoteMargin,
        fontFamily: style.fontFamily,
        borderRadius: "0 8px 8px 0",
      }}
    >
      <p
        style={{
          fontSize: "18px",
          fontStyle: "italic",
          color: style.quoteTextColor,
          margin: 0,
          lineHeight: "1.5",
        }}
      >
        {data.text}
      </p>
      {data.author && (
        <footer
          style={{
            marginTop: "12px",
            fontSize: "14px",
            fontWeight: 600,
            color: style.quoteAuthorColor,
          }}
        >
          {"\u2014"} {data.author}
        </footer>
      )}
    </blockquote>
  );
}
