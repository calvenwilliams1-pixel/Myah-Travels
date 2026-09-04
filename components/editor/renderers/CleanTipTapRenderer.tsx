import React from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

interface CleanTipTapRendererProps {
  content: string;
}

export default function CleanTipTapRenderer({ content }: CleanTipTapRendererProps) {
  let html = "";

  try {
    const json = JSON.parse(content);
    html = generateHTML(json, [StarterKit, Image, Link]);
  } catch {
    html = content;
  }

  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
