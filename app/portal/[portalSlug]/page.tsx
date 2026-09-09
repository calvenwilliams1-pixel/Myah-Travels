import React from "react";
import { cookies } from "next/headers";
import { validatePortalSession, getPortalBySlug } from "@/lib/portal";
import { getPortalItemsWithContent } from "@/lib/portal-items";
import { logActivity } from "@/lib/logging";
import HeroBanner from "@/components/portal/HeroBanner";
import WallItemRenderer from "@/components/portal/WallItemRenderer";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage({ params }: { params: { portalSlug: string } }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("portal_session")?.value;

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
          <p className="text-gray-600">Your session has expired. Please use a new access link.</p>
        </div>
      </div>
    );
  }

  const session = await validatePortalSession(sessionId);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
          <p className="text-gray-600">Your session has expired. Please use a new access link.</p>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner
        title={portal.heroTitle || portal.name}
        subtitle={portal.heroSubtitle || (portal.departureDate && portal.returnDate ? `${portal.departureDate} - ${portal.returnDate}` : undefined)}
        image={portal.heroImage}
        preset={portal.heroPreset || "minimal"}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-gray-500">No content yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <WallItemRenderer key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Contact Myah: myah@mycaltravels.com
        </p>
      </div>
    </div>
  );
}
