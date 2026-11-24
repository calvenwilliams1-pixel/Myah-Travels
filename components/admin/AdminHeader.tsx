"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const NAV_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/guide", label: "Guide" },
  { href: "/", label: "View Site ↗", external: true },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/content-library", label: "Content Library" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/portals", label: "Portals" },
  { href: "/admin/itineraries", label: "Itinerary Library" },
  { href: "/admin/settings", label: "Settings" },
];

interface AdminHeaderProps {
  username: string;
  onLogout: () => Promise<void>;
  /**
   * Whether the Guide link shows at all. The layout computes it: the
   * guide belongs to the owner's account, and only until it is
   * complete — a finished guide disappears completely, link included.
   */
  showGuide?: boolean;
}

export default function AdminHeader({ username, onLogout, showGuide = false }: AdminHeaderProps) {
  const [open, setOpen] = useState(false);
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const navLinks = NAV_LINKS.filter((l) => l.href !== "/admin/guide" || showGuide);

  const linkCls = "text-sm text-gray-600 hover:text-primary";
  const mobileLinkCls =
    "block py-2.5 text-base text-gray-700 hover:text-primary border-b border-gray-50 last:border-0";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4">
        <h1 className="text-base sm:text-xl font-semibold truncate min-w-0">
          Welcome back, {displayName}
        </h1>

        {/* Desktop: inline nav + user block (unchanged layout on lg+) */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-4 flex-wrap">
            {navLinks.map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                  title="View the live public site in a new tab"
                >
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className={linkCls}>
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm text-gray-600">Logged in as {username}</span>
            <form action={onLogout}>
              <Button variant="ghost" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>

        {/* Phone/tablet: menu button */}
        <button
          type="button"
          className="lg:hidden shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-700"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Phone/tablet: slide-down menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 px-4 py-2 bg-white">
          <nav className="flex flex-col">
            {navLinks.map((l) =>
              l.external ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={mobileLinkCls}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className={mobileLinkCls}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Logged in as {username}</span>
            <form action={onLogout}>
              <Button variant="ghost" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
