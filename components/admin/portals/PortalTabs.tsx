"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The portal tab strip (R3 of the UI overhaul): Members, Wall,
 * Itinerary, Notepad, sitting above a portal's own admin screens.
 * The screens themselves are unchanged and no URL moved. Members is
 * the portal home page; Wall is the existing edit page, where the
 * portal name and hero are edited too, exactly as before.
 *
 * The strip is deliberately not on the itinerary builder, her
 * hardest screen, which keeps a plain Back to portal link instead,
 * and not on the client preview.
 */
export default function PortalTabs({ portalId }: { portalId: number }) {
  const pathname = usePathname();
  const base = `/admin/portals/${portalId}`;
  const tabs = [
    { href: base, label: "Members", active: pathname === base },
    { href: `${base}/edit`, label: "Wall", active: pathname === `${base}/edit` },
    { href: `${base}/itinerary`, label: "Itinerary", active: pathname === `${base}/itinerary` },
    { href: `${base}/notepad`, label: "Notepad", active: pathname === `${base}/notepad` },
  ];

  return (
    <nav aria-label="Portal sections" className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`flex items-center whitespace-nowrap px-4 py-3 text-sm font-medium min-h-[44px] ${
            tab.active
              ? "text-primary border-b-2 border-primary -mb-px"
              : "text-gray-500 hover:text-primary"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
