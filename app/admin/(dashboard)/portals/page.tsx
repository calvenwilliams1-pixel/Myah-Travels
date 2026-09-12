import React from "react";
import Link from "next/link";
import { getPortals, getDeletedPortals } from "@/lib/portal";
import { requireAuth } from "@/lib/auth";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ConfirmSubmitButton from "@/components/ui/ConfirmSubmitButton";
import {
  archivePortalAction,
  deletePortalAction,
  restorePortalAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalsPage({
  searchParams,
}: {
  searchParams: { show?: string };
}) {
  await requireAuth();

  const showDeleted = searchParams.show === "deleted";
  const portals = showDeleted
    ? await getDeletedPortals()
    : await getPortals({ includeArchived: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {showDeleted ? "Deleted Portals" : "Client Portals"}
          </h2>
          {!showDeleted && (
            <p className="text-sm text-gray-500 mt-1">
              Manage trip portals. Deleted portals can be restored from the
              Deleted view.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {showDeleted ? (
            <Link href="/admin/portals">
              <Button variant="ghost">← Back to Active</Button>
            </Link>
          ) : (
            <>
              <Link href="/admin/portals?show=deleted">
                <Button variant="ghost">View Deleted</Button>
              </Link>
              <Link href="/admin/portals/new">
                <Button>+ New Portal</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Card padding="none">
        <Table
          columns={
            showDeleted
              ? [
                  {
                    header: "Name",
                    accessor: (portal: any) => (
                      <span className="font-medium text-gray-700">
                        {portal.name}
                      </span>
                    ),
                  },
                  {
                    header: "Departure",
                    accessor: (portal: any) => portal.departureDate || "—",
                  },
                  {
                    header: "Return",
                    accessor: (portal: any) => portal.returnDate || "—",
                  },
                  {
                    header: "Deleted",
                    accessor: (portal: any) =>
                      portal.deletedAt
                        ? new Date(portal.deletedAt).toLocaleDateString()
                        : "—",
                  },
                  {
                    header: "Actions",
                    accessor: (portal: any) => (
                      <form action={restorePortalAction}>
                        <input type="hidden" name="portalId" value={portal.id} />
                        <Button variant="secondary" size="sm" type="submit">
                          Restore
                        </Button>
                      </form>
                    ),
                  },
                ]
              : [
                  {
                    header: "Name",
                    accessor: (portal: any) => (
                      <Link
                        href={`/admin/portals/${portal.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {portal.name}
                      </Link>
                    ),
                  },
                  {
                    header: "Departure",
                    accessor: (portal: any) => portal.departureDate || "—",
                  },
                  {
                    header: "Return",
                    accessor: (portal: any) => portal.returnDate || "—",
                  },
                  {
                    header: "Status",
                    accessor: (portal: any) => (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          portal.isActive
                            ? "bg-success/10 text-success"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {portal.isActive ? "Active" : "Archived"}
                      </span>
                    ),
                  },
                  {
                    header: "Actions",
                    accessor: (portal: any) => (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/portals/${portal.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview wall"
                          aria-label="Preview wall"
                          className="text-gray-500 hover:text-primary text-base"
                        >
                          👁
                        </Link>
                        <form
                          action={deletePortalAction}
                          className="inline"
                        >
                          <input
                            type="hidden"
                            name="portalId"
                            value={portal.id}
                          />
                          <ConfirmSubmitButton
                            confirmMessage={`Delete portal "${portal.name}"? It can be restored from the Deleted view.`}
                            title="Delete portal"
                            className="text-gray-400 hover:text-red-600 text-base"
                          >
                            🗑
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    ),
                  },
                ]
          }
          data={portals}
          keyExtractor={(portal: any) => portal.id}
          rowClassName={(portal: any) =>
            portal.isActive ? "" : "bg-gray-50 opacity-80"
          }
          emptyMessage={
            showDeleted ? "No deleted portals." : "No portals yet."
          }
        />
      </Card>
    </div>
  );
}
