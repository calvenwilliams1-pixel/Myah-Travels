import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getFullItinerary, getItineraryById } from "@/lib/itineraries";
import { getAllSettings } from "@/lib/settings";
import ItineraryView from "@/components/portal/itinerary/ItineraryView";

export const dynamic = "force-dynamic";

// Portal-independent preview route. Used for archived itineraries
// (portal_id = null after purge) and as a general preview that doesn't
// require going through the portal tree.

export default async function LibraryItineraryPreviewPage({
  params,
}: {
  params: { itineraryId: string };
}) {
  await requireAuth();

  const itineraryId = Number(params.itineraryId);
  if (!itineraryId) notFound();

  const itinerary = await getFullItinerary(itineraryId);
  if (!itinerary) notFound();

  const settings = await getAllSettings();
  const sitePalette = {
    primary: settings.primary_color || "#4a7c59",
    accent: settings.accent_color || "#6b9ac4",
  };

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 print:hidden">
        <Link href="/admin/itineraries" className="hover:underline">
          ← Back to library
        </Link>
      </div>
      <ItineraryView
        itinerary={itinerary}
        portalSlug=""
        mode="admin-preview"
        portalId={itinerary.portalId ?? undefined}
        sitePalette={sitePalette}
      />
    </>
  );
}
