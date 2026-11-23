// Import from parse.ts directly: lib/canvas's index pulls in the DB
// layer, and this module is also imported by a client component.
import { parseCanvasDocument } from "@/lib/canvas/parse";
import type { CanvasDocument } from "@/types/canvas";

/**
 * Welcome templates (UI style plan, Pass 1b).
 *
 * The homepage welcome section has two render modes, chosen by the
 * `welcome_mode` setting: "canvas" (the original freeform editor —
 * the default, and what existing sites render until the owner flips
 * the switch) and "template" (one of three designed layouts filled
 * with the owner's photo and words, stored in `welcome_content`).
 *
 * Migration rule (from the plan, do not improvise around it): if the
 * live canvas still matches the seeded starter's shape, its photo
 * and words auto-carry into the template fields. If the owner has
 * reshaped the canvas so it no longer matches, the template starts
 * blank and the old content is surfaced for copy-paste instead —
 * auto-mapping is never guessed.
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

/**
 * The seeded starter's shape: element ids + types in order, from
 * scripts/starter-homepage-canvas.json. Editing the words or the
 * photo keeps the shape; adding, removing, or reordering elements
 * breaks it.
 */
const STARTER_SHAPE: { id: string; type: string }[] = [
  { id: "welcimg1", type: "image" },
  { id: "welchd01", type: "text" },
  { id: "welcbd01", type: "text" },
  { id: "welcbt01", type: "button" },
];

export function canvasMatchesStarterShape(doc: CanvasDocument | null): boolean {
  if (!doc || !Array.isArray(doc.elements)) return false;
  if (doc.elements.length !== STARTER_SHAPE.length) return false;
  return STARTER_SHAPE.every(
    (expected, i) =>
      doc.elements[i].id === expected.id && doc.elements[i].type === expected.type
  );
}

function elementText(el: { text?: string; richText?: string }): string {
  if (el.text && el.text.trim()) return el.text;
  if (el.richText) return el.richText.replace(/<[^>]*>/g, "").trim();
  return "";
}

/** Pull the template fields out of a shape-matching starter canvas. */
export function extractWelcomeContent(doc: CanvasDocument): WelcomeContent {
  const byId = new Map(doc.elements.map((el) => [el.id, el]));
  const img = byId.get("welcimg1") as { src?: string } | undefined;
  const heading = byId.get("welchd01");
  const body = byId.get("welcbd01");
  const button = byId.get("welcbt01") as { link?: string; text?: string } | undefined;
  return {
    photo: img?.src || "",
    heading: heading ? elementText(heading) : "",
    text: body ? elementText(body) : "",
    buttonLabel: button?.text || "",
    buttonHref: button?.link || "",
  };
}

/**
 * Plain-text summary of a canvas that does NOT match the starter
 * shape, so the owner can copy-paste their own words into the
 * template fields. Never used to auto-fill.
 */
export function summarizeCanvasContent(doc: CanvasDocument | null): string {
  if (!doc) return "";
  const lines: string[] = [];
  for (const el of doc.elements) {
    const anyEl = el as { src?: string; link?: string; text?: string; richText?: string; type: string };
    if (anyEl.type === "image" && anyEl.src) lines.push(`Photo: ${anyEl.src}`);
    else if (anyEl.type === "button") {
      const t = elementText(anyEl);
      if (t) lines.push(`Button: ${t}${anyEl.link ? ` (links to ${anyEl.link})` : ""}`);
    } else {
      const t = elementText(anyEl);
      if (t) lines.push(t);
    }
  }
  return lines.join("\n");
}

export type WelcomeContentSource = "stored" | "canvas" | "blank";

/**
 * Decide what the template fields hold: what the owner saved wins;
 * otherwise a shape-matching canvas carries over; otherwise blank.
 */
export function resolveWelcomeContent(
  storedJson: string | null,
  canvasJson: string | null
): { content: WelcomeContent; source: WelcomeContentSource } {
  if (storedJson) {
    try {
      const parsed = JSON.parse(storedJson) as Partial<WelcomeContent>;
      return {
        content: {
          photo: parsed.photo || "",
          heading: parsed.heading || "",
          text: parsed.text || "",
          buttonLabel: parsed.buttonLabel || "",
          buttonHref: parsed.buttonHref || "",
        },
        source: "stored",
      };
    } catch {
      // fall through to the canvas rules
    }
  }
  if (canvasJson) {
    const doc = parseCanvasDocument(canvasJson);
    if (doc && canvasMatchesStarterShape(doc)) {
      return { content: extractWelcomeContent(doc), source: "canvas" };
    }
  }
  return { content: EMPTY_WELCOME, source: "blank" };
}

export function parseWelcomeTemplateId(raw: string | null): WelcomeTemplateId {
  return raw === "overlay" || raw === "split" ? raw : "banner";
}
