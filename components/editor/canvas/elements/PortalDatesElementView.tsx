"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface PortalDatesElementViewProps {
  element: CanvasElement;
}

export default function PortalDatesElementView({ element }: PortalDatesElementViewProps) {
  const data = element.portalDatesData || {
    showDeparture: true,
    showReturn: true,
    showCountdown: true,
    label: "Trip Dates",
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <span className="text-2xl mb-2">📅</span>
      <span className="text-sm font-semibold text-blue-800">{data.label}</span>
      <div className="flex gap-4 mt-2 text-xs text-blue-600">
        {data.showDeparture && <span>Departure</span>}
        {data.showReturn && <span>Return</span>}
        {data.showCountdown && <span>Countdown</span>}
      </div>
    </div>
  );
}
