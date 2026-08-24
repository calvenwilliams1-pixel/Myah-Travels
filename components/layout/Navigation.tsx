"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? "text-emerald-700 font-semibold"
                : "text-gray-600 hover:text-emerald-700"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
