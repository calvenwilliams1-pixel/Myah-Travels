import React from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itineraries, portals } from "@/drizzle/schema";
import { and, isNull, eq, like, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import UseAsTemplateButton from "@/components/admin/itineraries/UseAsTemplateButton";

export const dynamic = "force-dynamic";

export default async function ItineraryLibraryPage({
  searchParams,
}: {
  searchParams?: { filter?: string; q?: string };
}) {
  await requireAuth();

  const filter = searchParams?.filter || "all";
  const q = (searchParams?.q || "").trim();

  const conditions: any[] = [isNull(itineraries.deletedAt)];
  if (filter === "live") conditions.push(eq(itineraries.isArchived, false));
  if (filter === "archived") conditions.push(eq(itineraries.isArchived, true));
  if (q) conditions.push(like(itineraries.title, "%" + q + "%"));

  const rows = await db
    .select({
      id: itineraries.id,
      title: itineraries.title,
      portalId: itineraries.portalId,
      isArchived: itineraries.isArchived,
      themePreset: itineraries.themePreset,
      createdAt: itineraries.createdAt,
      portalName: portals.name,
      portalSlug: portals.slug,
    })
    .from(itineraries)
    .leftJoin(portals, eq(itineraries.portalId, portals.id))
    .where(and(...conditions))
    .orderBy(desc(itineraries.createdAt))
    .limit(200);

  const portalsList = await db
    .select({ id: portals.id, name: portals.name })
    .from(portals)
    .where(isNull(portals.deletedAt))
    .orderBy(desc(portals.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Itinerary Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Every itinerary, live or archived. Archived itineraries are reusable as templates for new trips.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <Link href="/admin/itineraries">
          <Button variant={filter === "all" ? "primary" : "ghost"} size="sm">All</Button>
        </Link>
        <Link href="/admin/itineraries?filter=live">
          <Button variant={filter === "live" ? "primary" : "ghost"} size="sm">Live</Button>
        </Link>
        <Link href="/admin/itineraries?filter=archived">
          <Button variant={filter === "archived" ? "primary" : "ghost"} size="sm">Archived</Button>
        </Link>

        <form className="flex gap-2 ml-auto">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by title..."
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-gray-400 italic text-center py-8">No itineraries found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-gray-500">
                    {r.isArchived ? (
                      <span className="text-amber-600">Archived — portal purged</span>
                    ) : r.portalName ? (
                      <>
                        Live in{" "}
                        <Link href={"/admin/portals/" + r.portalId} className="text-primary hover:underline">
                          {r.portalName}
                        </Link>
                      </>
                    ) : (
                      "Detached"
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.portalId && (
                    <Link
                      href={"/admin/portals/" + r.portalId + "/itinerary/" + r.id + "/preview"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">Preview ↗</Button>
                    </Link>
                  )}
                  <UseAsTemplateButton
                    itineraryId={r.id}
                    itineraryTitle={r.title}
                    portals={portalsList}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
