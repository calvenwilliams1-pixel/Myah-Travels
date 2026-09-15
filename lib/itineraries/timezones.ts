// ============================================================
// IANA TIMEZONE LIST
// Grouped by region for a <select> with <optgroup>s.
// Cosmetic only — never used in any calculation.
// ============================================================

export interface TimezoneGroup {
  region: string;
  zones: string[];
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
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

/** Flatten all zone strings for quick lookup. */
export const ALL_TIMEZONES: string[] = TIMEZONE_GROUPS.flatMap((g) => g.zones);
