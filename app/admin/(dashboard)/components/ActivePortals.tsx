import React from "react";
import Link from "next/link";
import { getPortals } from "@/lib/portal";
import { Card } from "@/components/ui/Card";

export default async function ActivePortals() {
  const portals = await getPortals();
  const activePortals = portals.slice(0, 5);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Active Portals</h3>
        <Link href="/admin/portals" className="text-sm text-emerald-700 hover:underline">
          View all
        </Link>
      </div>
      {activePortals.length === 0 ? (
        <p className="text-gray-500 text-sm">No active portals.</p>
      ) : (
        <ul className="space-y-3">
          {activePortals.map((portal) => (
            <li key={portal.id}>
              <Link href={`/admin/portals/${portal.id}`} className="text-sm text-gray-700 hover:text-emerald-700 block">
                <span className="font-medium">{portal.name}</span>
                {portal.returnDate && (
                  <span className="text-xs text-gray-500 block">
                    Return: {portal.returnDate}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
