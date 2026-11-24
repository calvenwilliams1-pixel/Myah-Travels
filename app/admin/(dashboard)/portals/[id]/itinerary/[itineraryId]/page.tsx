"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ItineraryEditor from "@/components/admin/itinerary/ItineraryEditor";

export default function ItineraryEditorPage() {
  const params = useParams();
  const portalId = Number(params.id);
  const itineraryId = Number(params.itineraryId);

  if (!portalId || !itineraryId) {
    return <p className="text-gray-500">Invalid itinerary.</p>;
  }

  // No tab strip in the builder (R3): it is her hardest screen and
  // the strip would add height to it. A plain Back to portal link
  // is its way out instead.
  return (
    <div>
      <Link
        href={`/admin/portals/${portalId}`}
        className="inline-flex items-center min-h-[44px] text-sm font-medium text-gray-600 hover:text-primary"
      >
        ← Back to portal
      </Link>
      <ItineraryEditor portalId={portalId} itineraryId={itineraryId} />
    </div>
  );
}
