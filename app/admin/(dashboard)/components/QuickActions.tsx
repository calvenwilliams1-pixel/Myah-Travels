import React from "react";
import Link from "next/link";

/**
 * The dashboard job buttons (R2 of the UI overhaul). At most five,
 * one per job Myah actually does, labelled with the job in her words
 * rather than the name of the screen it opens. Every button links to
 * a screen that already exists; nothing moved.
 *
 * This row used to hold "+ New Post / + New Portal / + Template
 * Manager". Template Manager is not one of her jobs, so it left the
 * row; it is still in the header, one tap away, unchanged.
 */
const actions = [
  { href: "/admin/posts/new", label: "Write a post", hint: "For your homepage" },
  { href: "/admin/portals/new", label: "Start a portal", hint: "For a new trip or group" },
  { href: "/admin/portals", label: "Add a traveller", hint: "Pick the trip, then add them" },
  { href: "/admin/itineraries", label: "Build an itinerary", hint: "The day by day plan for a trip" },
  { href: "/admin/settings/email", label: "Did the invite go out?", hint: "Check your emails" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="rounded-xl bg-primary px-5 py-4 text-white transition-colors hover:bg-primary-dark"
        >
          <span className="block text-base font-semibold">{action.label}</span>
          <span className="block text-sm text-white/85 mt-0.5">{action.hint}</span>
        </Link>
      ))}
    </div>
  );
}
