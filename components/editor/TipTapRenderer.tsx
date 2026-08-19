import React from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

interface TipTapRendererProps {
  content: string;
}

export default function TipTapRenderer({ content }: TipTapRendererProps) {
  let html = "";
  
  try {
    const json = JSON.parse(content);
    html = generateHTML(json, [StarterKit, Image, Link]);
  } catch {
    html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
