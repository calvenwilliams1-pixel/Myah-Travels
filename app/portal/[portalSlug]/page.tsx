import React from "react";
import { cookies } from "next/headers";
import { validatePortalSession, getPortalBySlug, portalSessionCookieName, LEGACY_PORTAL_SESSION_COOKIE } from "@/lib/portal";
import { getPortalItemsWithContent } from "@/lib/portal-items";
import { attachDerivedItems } from "@/lib/itineraries/attach-derived-items";
import { logActivity } from "@/lib/logging";
import PortalWall from "@/components/portal/PortalWall";
import { getAllSettings } from "@/lib/settings";
import { darkenHex } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage({ params }: { params: { portalSlug: string } }) {
  const portal = await getPortalBySlug(params.portalSlug);

  const cookieStore = await cookies();
  // Per-portal cookie first; the legacy single cookie is still
  // accepted so this deploy doesn't sign existing clients out.
  const sessionId = portal
    ? cookieStore.get(portalSessionCookieName(portal.id))?.value ??
      cookieStore.get(LEGACY_PORTAL_SESSION_COOKIE)?.value
    : cookieStore.get(LEGACY_PORTAL_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return <SessionExpired />;
  }

  const session = await validatePortalSession(sessionId);

  if (!session) {
    return <SessionExpired />;
  }

  if (!portal || portal.id !== session.portalId || !portal.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600">This portal is no longer accessible.</p>
        </div>
      </div>
    );
  }

  await logActivity({
    userId: null,
    actionType: "portal_view",
    entityType: "portal",
    entityId: portal.id,
    details: `Portal wall viewed by member ${session.memberId}`,
  });

  const items = await getPortalItemsWithContent(portal.id);
  const itemsWithDerived = await attachDerivedItems(items);

  const settings = await getAllSettings();
  const primary = settings.primary_color || "#4a7c59";
  const brand = { from: primary, to: darkenHex(primary, 0.72) };

  return <PortalWall portal={portal} items={itemsWithDerived} brand={brand} />;
}

function SessionExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
        <p className="text-gray-600">Your session has expired. Please use a new access link.</p>
      </div>
    </div>
  );
}
