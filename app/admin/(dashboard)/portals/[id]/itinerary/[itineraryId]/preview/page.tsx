// SECURITY: Single-admin system. If multi-admin support is added,
// implement per-portal authorization here.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getFullItinerary } from "@/lib/itineraries";
import { getPortalById } from "@/lib/portal";
import { logActivity } from "@/lib/logging";
import ItineraryView from "@/components/portal/itinerary/ItineraryView";

export const dynamic = "force-dynamic";

export default async function AdminItineraryPreviewPage({
  params,
}: {
  params: { id: string; itineraryId: string };
}) {
  const admin = await requireAuth();

  const portalId = Number(params.id);
  const itineraryId = Number(params.itineraryId);
  if (!portalId || !itineraryId) notFound();

  const portal = await getPortalById(portalId);
  if (!portal) notFound();

  const itinerary = await getFullItinerary(itineraryId);
  if (!itinerary || itinerary.portalId !== portalId) notFound();

  await logActivity({
    userId: Number(admin.id),
    actionType: "preview",
    entityType: "itinerary",
    entityId: itinerary.id,
    details: "Admin previewed itinerary",
  });

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 print:hidden">
        <Link href={`/admin/portals/${portalId}/itinerary/${itineraryId}`} className="hover:underline">
          ← Back to editor
        </Link>
      </div>
      <ItineraryView itinerary={itinerary} portalSlug={portal.slug} portalId={portalId} mode="admin-preview" />
    </>
  );
}
