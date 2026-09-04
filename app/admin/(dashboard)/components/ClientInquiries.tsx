import React from "react";
import Link from "next/link";
import { getClients } from "@/lib/clients";
import { Card } from "@/components/ui/Card";

export default async function ClientInquiries() {
  const clients = await getClients({ limit: 5 });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Client Inquiries</h3>
        <Link href="/admin/clients" className="text-sm text-emerald-700 hover:underline">
          View all
        </Link>
      </div>
      {clients.length === 0 ? (
        <p className="text-gray-500 text-sm">No inquiries yet.</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((client: any) => (
            <li key={client.id} className="flex items-center justify-between gap-3">
              <Link href={`/admin/clients/${client.id}`} className="text-sm text-gray-700 hover:text-emerald-700 truncate flex-1 min-w-0">
                {client.fullName}
                {client.destination ? ` → ${client.destination}` : ""}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                client.status === "new" ? "bg-blue-100 text-blue-800" :
                client.status === "contacted" ? "bg-amber-100 text-amber-800" :
                client.status === "booked" ? "bg-emerald-100 text-emerald-800" :
                "bg-gray-100 text-gray-600"
              }`}>
                {client.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
