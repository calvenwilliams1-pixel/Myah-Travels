import React from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { validatePortalSession, getPortalBySlug } from "@/lib/portal";
import { getFullItinerary } from "@/lib/itineraries";
import { logActivity } from "@/lib/logging";
import ItineraryView from "@/components/portal/itinerary/ItineraryView";

export const dynamic = "force-dynamic";

export default async function ClientItineraryPage({
  params,
}: {
  params: { portalSlug: string; itineraryId: string };
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("portal_session")?.value;

  if (!sessionId) return <SessionExpired />;

  const session = await validatePortalSession(sessionId);
  if (!session) return <SessionExpired />;

  const portal = await getPortalBySlug(params.portalSlug);
  if (!portal || portal.id !== session.portalId || !portal.isActive) {
    return <AccessDenied />;
  }

  const itinerary = await getFullItinerary(Number(params.itineraryId));
  if (!itinerary || itinerary.portalId !== portal.id) {
    notFound();
  }

  await logActivity({
    userId: null,
    actionType: "itinerary_view",
    entityType: "itinerary",
    entityId: itinerary.id,
    details: `Itinerary viewed by member ${session.memberId}`,
  });

  return <ItineraryView itinerary={itinerary} portalSlug={params.portalSlug} />;
}

function SessionExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
        <p className="text-gray-600">Please use a new access link.</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p className="text-gray-600">This itinerary is not accessible.</p>
      </div>
    </div>
  );
}
