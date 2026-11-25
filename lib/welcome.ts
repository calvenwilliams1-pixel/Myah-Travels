/**
 * Welcome templates (UI style plan, Pass 1b).
 *
 * The homepage welcome section renders one of three designed
 * layouts (banner, overlay, split) filled with the owner's photo
 * and words, stored in the `welcome_content` setting.
 *
 * The freeform canvas welcome that predates the templates was
 * dropped entirely (Cal, 2026-11-24: "anything canvas drop"), code
 * and all. The stored canvas document still sits in the settings
 * table, unread; the words and photo it held were carried into
 * `welcome_content` long before the drop, so nothing was lost.
 */

export interface WelcomeContent {
  photo: string;
  heading: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
}

export const EMPTY_WELCOME: WelcomeContent = {
  photo: "",
  heading: "",
  text: "",
  buttonLabel: "",
  buttonHref: "",
};

export type WelcomeTemplateId = "banner" | "overlay" | "split";

export const WELCOME_TEMPLATES: { id: WelcomeTemplateId; name: string; blurb: string }[] = [
  {
    id: "banner",
    name: "Banner",
    blurb: "Your photo across the top, your words underneath. Closest to how your welcome looks now.",
  },
  {
    id: "overlay",
    name: "Overlay",
    blurb: "Your words right on the photo, like a travel magazine cover.",
  },
  {
    id: "split",
    name: "Split",
    blurb: "Photo on one side, words on the other. Calm and tidy.",
  },
];

/** The welcome fields the owner saved, or blanks when none are saved. */
export function resolveWelcomeContent(storedJson: string | null): WelcomeContent {
  if (storedJson) {
    try {
      const parsed = JSON.parse(storedJson) as Partial<WelcomeContent>;
      return {
        photo: parsed.photo || "",
        heading: parsed.heading || "",
        text: parsed.text || "",
        buttonLabel: parsed.buttonLabel || "",
        buttonHref: parsed.buttonHref || "",
      };
    } catch {
      // fall through to blank
    }
  }
  return EMPTY_WELCOME;
}

export function parseWelcomeTemplateId(raw: string | null): WelcomeTemplateId {
  return raw === "overlay" || raw === "split" ? raw : "banner";
}
