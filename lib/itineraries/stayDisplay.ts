// Shared display helpers for stays in the client portal. A stay's
// hotelName holds the display name for every kind (for a cruise, the
// ship's name); these helpers label it correctly per kind.

export interface StayLike {
  hotelName: string;
  kind?: string | null;
  cruiseLine?: string | null;
  resortBrand?: string | null;
}

export function stayKindIcon(kind: string | null | undefined): string {
  if (kind === "cruise") return "🚢";
  if (kind === "resort") return "🏝️";
  return "🏨";
}

/** "Aboard Icon of the Seas" on a ship, the plain name elsewhere. */
export function staySleepName(stay: StayLike): string {
  return stay.kind === "cruise" ? `Aboard ${stay.hotelName}` : stay.hotelName;
}

/** Secondary line for a stay card: cruise line, or resort brand. */
export function staySubline(stay: StayLike): string | null {
  if (stay.kind === "cruise") return stay.cruiseLine ?? null;
  if (stay.kind === "resort") return stay.resortBrand ?? null;
  return null;
}
