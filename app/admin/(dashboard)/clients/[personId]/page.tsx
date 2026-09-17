import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPersonById, listTripsForPerson } from "@/lib/clients/people";
import PersonNotes from "@/components/admin/clients/PersonNotes";
import TripTabs from "@/components/admin/clients/TripTabs";
import ForgetPersonButton from "@/components/admin/clients/ForgetPersonButton";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: { personId: string } }) {
  await requireAuth();

  const personId = Number(params.personId);
  if (!personId) notFound();

  const person = await getPersonById(personId);
  if (!person) notFound();

  const trips = await listTripsForPerson(personId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/clients" className="text-sm text-gray-500 hover:text-primary">
            ← All clients
          </Link>
          <h2 className="text-2xl font-semibold mt-1">
            {person.canonicalName || "(no name)"}
          </h2>
          <p className="text-sm text-gray-500">{person.email}</p>
        </div>
        <ForgetPersonButton personId={person.id} personLabel={person.canonicalName || person.email} />
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>Reminder:</strong> Do not store payment information, government-issued ID
          numbers, passport numbers, or home addresses here. Dietary restrictions, allergies,
          preferences, and personal notes are intended and supported.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonNotes
          personId={person.id}
          portalId={null}
          scopeLabel="Global notes (persist across all trips)"
        />
        <TripTabs
          trips={trips.map((t) => ({
            id: t.id,
            portalId: t.portalId,
            itineraryId: t.itineraryId,
            tripTitle: t.tripTitle,
            tripStartDate: t.tripStartDate,
            tripEndDate: t.tripEndDate,
            destination: t.destination,
          }))}
        />
      </div>
    </div>
  );
}
