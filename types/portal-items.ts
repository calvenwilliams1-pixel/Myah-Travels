export type PortalItemSourceType =
  | "library"
  | "portal_specific"
  | "itinerary"
  | "itinerary_glance"
  | "itinerary_today";

export const ITINERARY_SOURCE_TYPES: PortalItemSourceType[] = [
  "itinerary",
  "itinerary_glance",
  "itinerary_today",
];
