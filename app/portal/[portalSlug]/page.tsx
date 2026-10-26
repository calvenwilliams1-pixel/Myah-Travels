import React from "react";
import { cookies } from "next/headers";
import { validatePortalSession, getPortalBySlug } from "@/lib/portal";
import { getPortalItemsWithContent } from "@/lib/portal-items";
import { logActivity } from "@/lib/logging";
import PortalWall from "@/components/portal/PortalWall";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage({ params }: { params: { portalSlug: string } }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("portal_session")?.value;

  if (!sessionId) {
    return <SessionExpired />;
  }

  const session = await validatePortalSession(sessionId);

  if (!session) {
    return <SessionExpired />;
  }

  const portal = await getPortalBySlug(params.portalSlug);

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

  return <PortalWall portal={portal} items={items} />;
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
