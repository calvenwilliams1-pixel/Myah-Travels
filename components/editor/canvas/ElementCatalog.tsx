"use client";

import React from "react";
import { ElementType } from "@/types/canvas";

interface ElementCatalogProps {
  onAddElement: (type: ElementType) => void;
}

const CATALOG_SECTIONS: {
  title: string;
  items: { type: ElementType; label: string; icon: string }[];
}[] = [
  {
    title: "Text",
    items: [{ type: "text", label: "Text Box", icon: "T" }],
  },
  {
    title: "Media",
    items: [
      { type: "image", label: "Image", icon: "🖼️" },
      { type: "pdf", label: "PDF", icon: "📄" },
    ],
  },
  {
    title: "Shapes",
    items: [
      { type: "shape", label: "Shape", icon: "■" },
      { type: "divider", label: "Divider", icon: "—" },
    ],
  },
  {
    title: "Lists",
    items: [
      { type: "list", label: "Bullet List", icon: "•" },
      { type: "checklist", label: "Checklist", icon: "☑" },
      { type: "proscons", label: "Pros/Cons", icon: "±" },
    ],
  },
   {
    title: "Actions",
    items: [{ type: "button", label: "Button", icon: "🔘" }],
  },
  {
    title: "Portal",
    items: [
      { type: "portal_dates", label: "Portal Dates", icon: "📅" },
      { type: "portal_notices", label: "Portal Notices", icon: "📢" },
      { type: "portal_documents", label: "Portal Documents", icon: "📁" },
      { type: "portal_faqs", label: "Portal FAQs", icon: "❓" },
    ],
  },
];

export default function ElementCatalog({ onAddElement }: ElementCatalogProps) {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Elements</h3>

        {CATALOG_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddElement(item.type)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
