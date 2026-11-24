import { WORDING_REGISTRY } from "./registry";

/**
 * The wording studio's surfaces (the preview editor that replaced
 * the form-style wording page). Each surface is one thing a client
 * actually sees — the invite email, the access page, the two
 * messages, the About words — and holds the registry keys whose
 * words appear on it. invite_eyebrow appears twice by design: it
 * sits at the top of the email and on the access page, and the
 * registry says so in its helper text.
 *
 * The coverage test (tests/wording-studio.test.ts) pins that every
 * registry key is reachable from the studio.
 */
export type StudioSurfaceId = "email" | "access" | "deadlink" | "session" | "about";

export interface StudioSurface {
  id: StudioSurfaceId;
  title: string;
  blurb: string;
  keys: string[];
}

export const STUDIO_SURFACES: StudioSurface[] = [
  {
    id: "email",
    title: "Invite email",
    blurb: "The email a client gets when you add them to a portal.",
    keys: [
      "invite_subject",
      "invite_eyebrow",
      "invite_greeting",
      "invite_body_trip",
      "invite_body_promo",
      "invite_expiry_trip",
      "invite_expiry_promo",
      "invite_fallback_hint",
      "invite_footer_reason",
    ],
  },
  {
    id: "access",
    title: "Portal access page",
    blurb: "The page a client lands on when they tap the link in their email.",
    keys: ["invite_eyebrow", "access_note"],
  },
  {
    id: "deadlink",
    title: "Expired link message",
    blurb: "What a client sees when their link no longer works.",
    keys: ["deadlink_heading", "deadlink_body"],
  },
  {
    id: "session",
    title: "Session ended message",
    blurb: "What a client sees when their visit times out and they are signed out.",
    keys: ["session_heading", "session_body"],
  },
  {
    id: "about",
    title: "About page",
    blurb: "The words about you on your About page, until you write your own there.",
    keys: ["bio_text"],
  },
];

/** Every registry key the studio can edit, in surface order. */
export function studioKeys(): string[] {
  const seen = new Set<string>();
  for (const surface of STUDIO_SURFACES) {
    for (const key of surface.keys) seen.add(key);
  }
  return [...seen];
}

/** Registry keys with no studio surface (should always be empty). */
export function keysMissingFromStudio(): string[] {
  const covered = new Set(studioKeys());
  return WORDING_REGISTRY.map((e) => e.key).filter((k) => !covered.has(k));
}
