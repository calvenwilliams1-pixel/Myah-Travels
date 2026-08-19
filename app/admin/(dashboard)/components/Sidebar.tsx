"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/posts", label: "Blog Posts", icon: "📝" },
  { href: "/admin/guides", label: "Guides", icon: "🗺️" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/media", label: "Media", icon: "🖼️" },
  { href: "/admin/clients", label: "Clients", icon: "👥" },
  { href: "/admin/portals", label: "Portals", icon: "🔗" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen hidden md:block">
      <nav className="p-4 space-y-1" aria-label="Admin Navigation">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
