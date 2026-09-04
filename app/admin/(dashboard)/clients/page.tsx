import React from "react";
import Link from "next/link";
import { getClients } from "@/lib/clients";
import { requireAuth } from "@/lib/auth";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: { sort?: string; search?: string };
}) {
  await requireAuth();

  const clients = await getClients({
    search: searchParams?.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Client Inquiries</h2>
        <div className="flex gap-3 items-center">
          <a href="/api/clients/export">
            <Button variant="ghost">Export CSV</Button>
          </a>
          <span className="text-sm text-gray-500">{clients.length} total</span>
        </div>
      </div>

      <form className="flex gap-3">
        <input
          type="text"
          name="search"
          placeholder="Search by name, email, or destination..."
          defaultValue={searchParams?.search || ""}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button type="submit" className="px-4 py-2 bg-emerald-700 text-white rounded-lg">
          Search
        </button>
      </form>

      <Card padding="none">
        <Table
          columns={[
            {
              header: "Name",
              accessor: (client: any) => (
                <Link href={`/admin/clients/${client.id}`} className="font-medium hover:text-emerald-700">
                  {client.fullName}
                </Link>
              ),
            },
            {
              header: "Contact",
              accessor: (client: any) => client.email || client.phone || "—",
            },
            {
              header: "Destination",
              accessor: (client: any) => client.destination || "—",
            },
            {
              header: "Status",
              accessor: (client: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === "new" ? "bg-blue-100 text-blue-800" :
                  client.status === "contacted" ? "bg-amber-100 text-amber-800" :
                  client.status === "booked" ? "bg-emerald-100 text-emerald-800" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {client.status}
                </span>
              ),
            },
            {
              header: "Received",
              accessor: (client: any) =>
                client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "Not available",
            },
          ]}
          data={clients}
          keyExtractor={(client) => client.id}
          emptyMessage="No inquiries yet."
        />
      </Card>
    </div>
  );
}
