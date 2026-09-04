import React from "react";
import Link from "next/link";

const actions = [
  { href: "/admin/posts/new", label: "+ New Post", color: "bg-emerald-700 hover:bg-emerald-800" },

  { href: "/admin/portals/new", label: "+ New Portal", color: "bg-emerald-800 hover:bg-emerald-900" },
  { href: "/admin/templates", label: "+ Template Manager", color: "bg-blue-700 hover:bg-blue-800" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`${action.color} text-white text-sm font-medium rounded-lg px-4 py-3 text-center transition-colors`}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
