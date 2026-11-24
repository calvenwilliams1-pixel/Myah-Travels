/**
 * The wording registry: every client-facing string Myah can edit from
 * Admin → Settings → Words clients read (the R1 release of the UI
 * overhaul plan, 2026-11-24).
 *
 * Defaults live here, in code. A row in the settings table overrides a
 * default; saving a field empty deletes the override and the default
 * returns, so nothing can ever render blank. Registry keys are
 * `wording_`-prefixed in the settings table so they cannot collide
 * with existing settings keys — bio_text is the one exception, because
 * that key already existed.
 *
 * This module is pure (no database, no React) so the email templates,
 * the portal pages, the admin screen, and the tests all share it.
 */

export type WordingGroupId = "invite" | "access" | "portal-messages" | "about";

export interface WordingEntry {
  /** Short key, e.g. "invite_subject". */
  key: string;
  /** The settings-table key that stores the override. */
  settingsKey: string;
  group: WordingGroupId;
  /** Plain label shown on the admin screen. */
  label: string;
  /** One plain sentence under the field, if it needs one. */
  helper?: string;
  /**
   * True for fields that describe how a link behaves. The editor adds
   * the standing note: changing the wording does not change how the
   * link works.
   */
  behaviourNote?: boolean;
  defaultValue: string;
  maxLength: number;
  multiline: boolean;
  /** Tokens this field may use, e.g. ["name", "portal", "date"]. */
  allowedTokens: string[];
  /** Tokens that must be present or the sentence is not true. */
  requiredTokens: string[];
  /** Where the words appear, in plain language, for the editor. */
  appearsAt: string[];
}

export const WORDING_GROUPS: { id: WordingGroupId; title: string; intro: string }[] = [
  {
    id: "invite",
    title: "Invite email",
    intro: "The email a client gets when you add them to a portal.",
  },
  {
    id: "access",
    title: "Access page",
    intro: "The page a client lands on when they tap their link.",
  },
  {
    id: "portal-messages",
    title: "Portal messages",
    intro: "What a client sees when a link or a session has run out.",
  },
  {
    id: "about",
    title: "About page",
    intro: "The words about you on your public About page.",
  },
];

const EMAIL_TOKENS = ["name", "portal", "date"];
const NO_TOKENS: string[] = [];

export const WORDING_REGISTRY: WordingEntry[] = [
  // ---- Invite email (lib/email/templates.ts, magicLinkEmail) ----
  {
    key: "invite_subject",
    settingsKey: "wording_invite_subject",
    group: "invite",
    label: "Email subject",
    defaultValue: "Your {portal} Access Link",
    maxLength: 80,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The subject line of the invite email"],
  },
  {
    key: "invite_eyebrow",
    settingsKey: "wording_invite_eyebrow",
    group: "invite",
    label: "Small line above the portal name",
    helper: "This line appears in two places: in the invite email, and on the page the client lands on when they tap their link.",
    defaultValue: "Your portal is ready",
    maxLength: 40,
    multiline: false,
    // Only {portal}: this line also renders on the access page, where
    // there is no member name or expiry date to fill in.
    allowedTokens: ["portal"],
    requiredTokens: [],
    appearsAt: ["The invite email", "The portal access page"],
  },
  {
    key: "invite_greeting",
    settingsKey: "wording_invite_greeting",
    group: "invite",
    label: "Greeting",
    defaultValue: "Hi {name},",
    maxLength: 40,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The first line of the invite email"],
  },
  {
    key: "invite_body_trip",
    settingsKey: "wording_invite_body_trip",
    group: "invite",
    label: "Main text, trip portals",
    defaultValue:
      "You've been added to the {portal} portal. That's where your trip information, documents and updates live. Click below to step inside.",
    maxLength: 300,
    multiline: true,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The invite email for a trip portal"],
  },
  {
    key: "invite_body_promo",
    settingsKey: "wording_invite_body_promo",
    group: "invite",
    label: "Main text, the Explore portal",
    defaultValue:
      "You've been added to the {portal} portal. That's where Myah shares sample itineraries, travel ideas and offers, just for you. Click below to step inside.",
    maxLength: 300,
    multiline: true,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The invite email for the Explore Travel With Me portal"],
  },
  {
    key: "invite_fallback_hint",
    settingsKey: "wording_invite_fallback_hint",
    group: "invite",
    label: "Line above the copy-and-paste link",
    defaultValue: "Button not working? Copy this link into your browser:",
    maxLength: 90,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["Under the button in the invite email"],
  },
  {
    key: "invite_expiry_trip",
    settingsKey: "wording_invite_expiry_trip",
    group: "invite",
    label: "Expiry line, trip portals",
    behaviourNote: true,
    defaultValue: "This link expires on {date}. If you need a new link, contact Myah.",
    maxLength: 140,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: ["date"],
    appearsAt: ["The foot of the invite email for a trip portal"],
  },
  {
    key: "invite_expiry_promo",
    settingsKey: "wording_invite_expiry_promo",
    group: "invite",
    label: "Expiry line, the Explore portal",
    behaviourNote: true,
    defaultValue:
      "This link doesn't expire. Save it and come back any time. If you lose it, contact Myah for a new one.",
    maxLength: 140,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The foot of the invite email for the Explore portal"],
  },
  {
    key: "invite_footer_reason",
    settingsKey: "wording_invite_footer_reason",
    group: "invite",
    label: "Footer line",
    defaultValue: "You're receiving this because Myah added you to a client portal.",
    maxLength: 120,
    multiline: false,
    allowedTokens: EMAIL_TOKENS,
    requiredTokens: [],
    appearsAt: ["The footer of the invite email"],
  },

  // ---- Access page (app/portal/access/[token]/page.tsx) ----
  {
    key: "access_note",
    settingsKey: "wording_access_note",
    group: "access",
    label: "Note under the button",
    behaviourNote: true,
    defaultValue: "This link is yours. Save this email to come back to your portal.",
    maxLength: 90,
    multiline: false,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["Under the Continue button on the portal access page"],
  },

  // ---- Portal messages (access page dead-link state, portal pages) ----
  {
    key: "deadlink_heading",
    settingsKey: "wording_deadlink_heading",
    group: "portal-messages",
    label: "Dead link, heading",
    defaultValue: "Link Expired or Invalid",
    maxLength: 60,
    multiline: false,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["The page a client sees when their link no longer works"],
  },
  {
    key: "deadlink_body",
    settingsKey: "wording_deadlink_body",
    group: "portal-messages",
    label: "Dead link, text",
    behaviourNote: true,
    defaultValue: "This access link is no longer valid. Please contact Myah for a new link.",
    maxLength: 140,
    multiline: true,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["Under the dead-link heading"],
  },
  {
    key: "session_heading",
    settingsKey: "wording_session_heading",
    group: "portal-messages",
    label: "Session ended, heading",
    defaultValue: "Session Expired",
    maxLength: 60,
    multiline: false,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["The page a client sees when their session has ended"],
  },
  {
    key: "session_body",
    settingsKey: "wording_session_body",
    group: "portal-messages",
    label: "Session ended, text",
    behaviourNote: true,
    defaultValue:
      "Your session has expired. Open your original access link again, or contact Myah for a new one.",
    maxLength: 140,
    multiline: true,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["Under the session-ended heading"],
  },

  // ---- About (existing settings key, reused) ----
  {
    key: "bio_text",
    settingsKey: "bio_text",
    group: "about",
    label: "About you",
    defaultValue:
      "Black mom of three and wife to the mushroom king, I've always loved to travel almost as much as I love to create a new world through writing. I'm at this beautiful point in my life where I want to combine my love for both and share that with you all.",
    maxLength: 1200,
    multiline: true,
    allowedTokens: NO_TOKENS,
    requiredTokens: [],
    appearsAt: ["Your public About page"],
  },
];

export const WORDING_BY_KEY: Record<string, WordingEntry> = Object.fromEntries(
  WORDING_REGISTRY.map((entry) => [entry.key, entry])
);

/** The invite email's wording, resolved to plain strings. */
export interface InviteCopy {
  subject: string;
  eyebrow: string;
  greeting: string;
  bodyTrip: string;
  bodyPromo: string;
  fallbackHint: string;
  expiryTrip: string;
  expiryPromo: string;
  footerReason: string;
}

const TOKEN_PATTERN = /\{([a-zA-Z]+)\}/g;

/**
 * Validate one field value. Returns a plain-language error, or null
 * when the value is fine. A refused save is expensive for this user,
 * so the only refusals are: too long, a token the field cannot use,
 * and a required token missing (without it the sentence is not true).
 */
export function validateWordingValue(entry: WordingEntry, value: string): string | null {
  if (value.length > entry.maxLength) {
    return `That is ${value.length} characters, and the limit for this field is ${entry.maxLength}. Shorten it a little and save again.`;
  }
  const found = [...value.matchAll(TOKEN_PATTERN)].map((m) => m[1]);
  for (const token of found) {
    if (!entry.allowedTokens.includes(token)) {
      return `"{${token}}" is not a token this field can use. The tokens that work here are: ${
        entry.allowedTokens.length
          ? entry.allowedTokens.map((t) => `{${t}}`).join(", ")
          : "none — this field is plain words only"
      }.`;
    }
  }
  for (const required of entry.requiredTokens) {
    if (!found.includes(required)) {
      return `This field needs {${required}} in it. Without it, the sentence would not be true.`;
    }
  }
  return null;
}

/**
 * The value that should render: the override when one is stored and
 * still valid, the default otherwise. Empty means default. An
 * override that fails validation (possible if it was stored before a
 * rule changed) falls back to the default at render/send time, so a
 * client never sees broken wording.
 */
export function resolveWordingValue(
  entry: WordingEntry,
  override: string | null | undefined
): string {
  if (override == null) return entry.defaultValue;
  if (override.trim() === "") return entry.defaultValue;
  if (validateWordingValue(entry, override)) return entry.defaultValue;
  return override;
}

/** Resolve every registry entry against a settings map. */
export function resolveAllWording(
  overrides: Record<string, string | null | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of WORDING_REGISTRY) {
    out[entry.key] = resolveWordingValue(entry, overrides[entry.settingsKey]);
  }
  return out;
}

/** Resolve the invite email's copy from a settings map. */
export function resolveInviteCopy(
  overrides: Record<string, string | null | undefined>
): InviteCopy {
  const all = resolveAllWording(overrides);
  return {
    subject: all.invite_subject,
    eyebrow: all.invite_eyebrow,
    greeting: all.invite_greeting,
    bodyTrip: all.invite_body_trip,
    bodyPromo: all.invite_body_promo,
    fallbackHint: all.invite_fallback_hint,
    expiryTrip: all.invite_expiry_trip,
    expiryPromo: all.invite_expiry_promo,
    footerReason: all.invite_footer_reason,
  };
}

/** Fill {name}, {portal} and {date} in a wording string. */
export function substituteTokens(
  text: string,
  subs: { name?: string; portal?: string; date?: string }
): string {
  return text.replace(TOKEN_PATTERN, (whole, token: string) => {
    if (token === "name" && subs.name !== undefined) return subs.name;
    if (token === "portal" && subs.portal !== undefined) return subs.portal;
    if (token === "date" && subs.date !== undefined) return subs.date;
    return whole;
  });
}

/**
 * The expiry date as clients read it: "December 5, 2026". The
 * timezone is pinned to America/Toronto in the format itself — before
 * R1 this relied on the server happening to run in Toronto.
 */
export function formatExpiryLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
