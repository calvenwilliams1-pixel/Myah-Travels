// The deals band on the homepage is fed by promo flyers synced from
// Myah's agency storefront (dslaptravel.com). The sync script stores a
// JSON array in the `promo_deals` setting; this module is the only
// reader, and it is deliberately strict: anything that isn't a clean
// {image, href, title} with https URLs is dropped, so a bad sync can
// shrink the band but can never break the page or inject markup.

export interface PromoDeal {
  image: string;
  href: string;
  title: string;
}

export const MAX_PROMOS = 8;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function parsePromoDeals(raw: string | null | undefined): PromoDeal[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: PromoDeal[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const { image, href, title } = item as Record<string, unknown>;
    if (typeof image !== "string" || typeof href !== "string") continue;
    if (!isHttpsUrl(image) || !isHttpsUrl(href)) continue;
    out.push({
      image,
      href,
      title: typeof title === "string" ? title.trim().slice(0, 140) : "",
    });
    if (out.length >= MAX_PROMOS) break;
  }
  return out;
}
