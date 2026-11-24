import React from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { validatePortalSession, getPortalBySlug, portalSessionCookieName, LEGACY_PORTAL_SESSION_COOKIE } from "@/lib/portal";
import { getFullItinerary } from "@/lib/itineraries";
import { logActivity } from "@/lib/logging";
import ItineraryView from "@/components/portal/itinerary/ItineraryView";
import { getAllSettings } from "@/lib/settings";
import { getWording } from "@/lib/wording";

export const dynamic = "force-dynamic";

export default async function ClientItineraryPage({
  params,
}: {
  params: { portalSlug: string; itineraryId: string };
}) {
  const portal = await getPortalBySlug(params.portalSlug);

  const cookieStore = await cookies();
  const sessionId = portal
    ? cookieStore.get(portalSessionCookieName(portal.id))?.value ??
      cookieStore.get(LEGACY_PORTAL_SESSION_COOKIE)?.value
    : cookieStore.get(LEGACY_PORTAL_SESSION_COOKIE)?.value;

  if (!sessionId) return <SessionExpired />;

  const session = await validatePortalSession(sessionId);
  if (!session) return <SessionExpired />;

  if (!portal || portal.id !== session.portalId || !portal.isActive) {
    return <AccessDenied />;
  }

  const settings = await getAllSettings();
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

  return (
    <ItineraryView
      itinerary={itinerary}
      portalSlug={params.portalSlug}
      coverImage={portal.heroImage}
      sitePalette={{
        primary: settings.primary_color || "#4a7c59",
        accent: settings.accent_color || "#6b9ac4",
      }}
    />
  );
}

async function SessionExpired() {
  const wording = await getWording();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">{wording.session_heading}</h1>
        <p className="text-gray-600">{wording.session_body}</p>
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
