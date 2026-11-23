// ============================================================
// IANA TIMEZONE LIST
// Grouped by region for a <select> with <optgroup>s. These
// values are load-bearing, not cosmetic: a section's timezone
// drives the client portal's "today", and leg timezones label
// every departure/arrival time.
//
// The list is generated from the platform's own tz database
// (Intl.supportedValuesOf) so it always covers every zone the
// airport catalog can produce and never goes stale. The static
// list below is only a fallback for runtimes without it.
// ============================================================

export interface TimezoneGroup {
  region: string;
  zones: string[];
}

const STATIC_TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    region: "UTC",
    zones: ["UTC"],
  },
  {
    region: "Africa",
    zones: [
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi",
    ],
  },
  {
    region: "America — North",
    zones: [
      "America/Anchorage",
      "America/Chicago",
      "America/Denver",
      "America/Edmonton",
      "America/Halifax",
      "America/Los_Angeles",
      "America/Mexico_City",
      "America/New_York",
      "America/Phoenix",
      "America/Regina",
      "America/St_Johns",
      "America/Toronto",
      "America/Vancouver",
      "America/Winnipeg",
    ],
  },
  {
    region: "America — Central & South",
    zones: [
      "America/Bogota",
      "America/Lima",
      "America/Panama",
      "America/Santiago",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
    ],
  },
  {
    region: "Asia",
    zones: [
      "Asia/Bangkok",
      "Asia/Dubai",
      "Asia/Hong_Kong",
      "Asia/Jakarta",
      "Asia/Jerusalem",
      "Asia/Kathmandu",
      "Asia/Kolkata",
      "Asia/Kuala_Lumpur",
      "Asia/Manila",
      "Asia/Seoul",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Asia/Taipei",
      "Asia/Tokyo",
      "Asia/Ho_Chi_Minh",
    ],
  },
  {
    region: "Atlantic",
    zones: ["Atlantic/Azores", "Atlantic/Reykjavik"],
  },
  {
    region: "Australia & Pacific",
    zones: [
      "Australia/Adelaide",
      "Australia/Brisbane",
      "Australia/Darwin",
      "Australia/Hobart",
      "Australia/Melbourne",
      "Australia/Perth",
      "Australia/Sydney",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Honolulu",
    ],
  },
  {
    region: "Europe",
    zones: [
      "Europe/Amsterdam",
      "Europe/Athens",
      "Europe/Berlin",
      "Europe/Brussels",
      "Europe/Bucharest",
      "Europe/Copenhagen",
      "Europe/Dublin",
      "Europe/Helsinki",
      "Europe/Istanbul",
      "Europe/Lisbon",
      "Europe/London",
      "Europe/Madrid",
      "Europe/Moscow",
      "Europe/Oslo",
      "Europe/Paris",
      "Europe/Prague",
      "Europe/Rome",
      "Europe/Stockholm",
      "Europe/Vienna",
      "Europe/Warsaw",
      "Europe/Zurich",
    ],
  },
];

function buildGroupsFromIntl(): TimezoneGroup[] | null {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof fn !== "function") return null;
    const zones = fn.call(Intl, "timeZone");
    if (!Array.isArray(zones) || zones.length === 0) return null;
    const byRegion = new Map<string, string[]>();
    for (const z of zones) {
      if (z === "UTC") continue;
      const region = z.includes("/") ? z.split("/")[0] : "Other";
      const arr = byRegion.get(region) ?? [];
      arr.push(z);
      byRegion.set(region, arr);
    }
    const groups: TimezoneGroup[] = [{ region: "UTC", zones: ["UTC"] }];
    for (const region of [...byRegion.keys()].sort()) {
      groups.push({ region, zones: byRegion.get(region)!.sort() });
    }
    return groups;
  } catch {
    return null;
  }
}

// Valid IANA names that some ICU builds leave out of
// supportedValuesOf (links and a few canonical zones) but that
// Intl still resolves correctly — and that the airport catalog
// uses. Merged into the picker so every catalog zone is
// selectable. The coverage test in timezones.test.ts names any
// future addition needed here.
const EXTRA_ZONES: string[] = [
  "America/Argentina/Buenos_Aires",
  "America/Indiana/Indianapolis",
  "America/Yellowknife",
  "Asia/Choibalsan",
  "Asia/Ho_Chi_Minh",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Yangon",
  "Europe/Zaporozhye",
  "Pacific/Johnston",
];

function withExtraZones(groups: TimezoneGroup[]): TimezoneGroup[] {
  const present = new Set(groups.flatMap((g) => g.zones));
  const out = groups.map((g) => ({ region: g.region, zones: [...g.zones] }));
  for (const z of EXTRA_ZONES) {
    if (present.has(z)) continue;
    const region = z.split("/")[0];
    let group = out.find((g) => g.region === region);
    if (!group) {
      group = { region, zones: [] };
      out.push(group);
    }
    group.zones.push(z);
    group.zones.sort();
  }
  return out;
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = withExtraZones(
  buildGroupsFromIntl() ?? STATIC_TIMEZONE_GROUPS
);

/** Flatten all zone strings for quick lookup. */
export const ALL_TIMEZONES: string[] = TIMEZONE_GROUPS.flatMap((g) => g.zones);
