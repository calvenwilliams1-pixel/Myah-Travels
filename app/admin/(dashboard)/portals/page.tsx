import React from "react";
import Link from "next/link";
import { getPortals } from "@/lib/portal";
import { requireAuth } from "@/lib/auth";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PortalsPage() {
  await requireAuth();
  const portals = await getPortals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Client Portals</h2>
        <Link href="/admin/portals/new">
          <Button>+ New Portal</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table
          columns={[
            {
              header: "Name",
              accessor: (portal: any) => (
                <Link href={`/admin/portals/${portal.id}`} className="font-medium hover:text-emerald-700">
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  portal.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {portal.isActive ? "Active" : "Archived"}
                </span>
              ),
            },
            {
              header: "Created",
              accessor: (portal: any) =>
                portal.createdAt ? new Date(portal.createdAt).toLocaleDateString() : "Not available",
            },
          ]}
          data={portals}
          keyExtractor={(portal) => portal.id}
          emptyMessage="No portals yet."
        />
      </Card>
    </div>
  );
}
