// SECURITY: This system currently has only one admin account.
// If multi-admin support is ever added, implement per-portal authorization here.
// Until then, any authenticated admin can preview any portal.

import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getPortalById } from "@/lib/portal";
import { getPortalItemsWithContent } from "@/lib/portal-items";
import { attachDerivedItems } from "@/lib/itineraries/attach-derived-items";
import { logActivity } from "@/lib/logging";
import PortalWall from "@/components/portal/PortalWall";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage({ params }: { params: { id: string } }) {
  const admin = await requireAuth();

  const portalId = Number(params.id);
  if (!portalId) {
    return (
      <AdminPreviewShell>
        <PreviewBanner variant="error">Invalid portal ID.</PreviewBanner>
      </AdminPreviewShell>
    );
  }

  const portal = await getPortalById(portalId);

  if (!portal) {
    return (
      <AdminPreviewShell>
        <PreviewBanner variant="error">Portal not found.</PreviewBanner>
      </AdminPreviewShell>
    );
  }

  // Soft-delete handling
  if (portal.deletedAt) {
    return (
      <AdminPreviewShell>
        <PreviewBanner variant="error">This portal has been deleted.</PreviewBanner>
      </AdminPreviewShell>
    );
  }

  if (portal.archivedAt) {
    return (
      <AdminPreviewShell>
        <PreviewBanner variant="warning">This portal has been archived.</PreviewBanner>
      </AdminPreviewShell>
    );
  }

  if (!portal.isActive) {
    return (
      <AdminPreviewShell>
        <PreviewBanner variant="warning">Portal is inactive and cannot be previewed.</PreviewBanner>
      </AdminPreviewShell>
    );
  }

  await logActivity({
    userId: Number(admin.id),
    actionType: "preview",
    entityType: "portal",
    entityId: portal.id,
    details: "Admin previewed portal wall",
  });

  const items = await getPortalItemsWithContent(portal.id);
  const itemsWithDerived = await attachDerivedItems(items);

  return (
    <AdminPreviewShell portalId={portal.id}>
      <PreviewBanner variant="info">Preview mode — this is what your client sees.</PreviewBanner>
      <PortalWall portal={portal} items={itemsWithDerived} mode="admin-preview" />
    </AdminPreviewShell>
  );
}

function AdminPreviewShell({
  children,
  portalId,
}: {
  children: React.ReactNode;
  portalId?: number;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Admin Preview</span>
        <div className="flex items-center gap-4">
          {portalId && (
            <>
              <Link
                href={`/admin/portals/${portalId}`}
                className="text-sm text-gray-300 hover:text-white"
              >
                ← Back to Portal
              </Link>
              <Link
                href={`/admin/portals/${portalId}/edit`}
                className="text-sm bg-primary text-white px-3 py-1 rounded hover:opacity-90"
              >
                Edit Portal
              </Link>
            </>
          )}
          <Link
            href="/admin/portals"
            className="text-sm text-gray-300 hover:text-white"
          >
            ← All Portals
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function PreviewBanner({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "error";
}) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`border-b px-6 py-3 text-sm font-medium ${styles[variant]}`}>
      {children}
    </div>
  );
}
