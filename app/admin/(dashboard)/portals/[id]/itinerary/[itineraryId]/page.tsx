"use client";

import React from "react";
import { useParams } from "next/navigation";
import ItineraryEditor from "@/components/admin/itinerary/ItineraryEditor";

export default function ItineraryEditorPage() {
  const params = useParams();
  const portalId = Number(params.id);
  const itineraryId = Number(params.itineraryId);

  if (!portalId || !itineraryId) {
    return <p className="text-gray-500">Invalid itinerary.</p>;
  }

  return <ItineraryEditor portalId={portalId} itineraryId={itineraryId} />;
}
