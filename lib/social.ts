// Linking a post to its companion posts on other platforms.
//
// A post can carry one Instagram link (a post or reel) and one YouTube
// link (a specific video). These helpers are pure and shared by the
// admin actions (validation on save) and the public post page (the
// YouTube embed). Anything that doesn't parse cleanly is rejected on
// save, so the public page can trust what's stored.

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Extract the 11-character video id from a YouTube URL, or null. */
export function youtubeVideoId(
  url: string | null | undefined
): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return VIDEO_ID.test(id) ? id : null;
  }
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com"
  ) {
    if (u.pathname === "/watch") {
      const v = u.searchParams.get("v");
      return v && VIDEO_ID.test(v) ? v : null;
    }
    const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  return null;
}

/**
 * Validate + normalize a social link for saving. Returns the trimmed
 * URL, or null when the field is empty. Throws on a non-empty value
 * that isn't a usable link for that platform, so the caller can show
 * the author a plain-language error instead of silently dropping it.
 */
export function cleanSocialUrl(
  raw: string | null | undefined,
  kind: "instagram" | "youtube"
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > 500) {
    throw new Error("That link is too long.");
  }
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error("That doesn't look like a full link — paste the whole address.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Error("That doesn't look like a full link — paste the whole address.");
  }
  const host = u.hostname.toLowerCase();
  if (kind === "instagram") {
    if (!INSTAGRAM_HOSTS.has(host)) {
      throw new Error("That isn't an Instagram link — paste the link to the Instagram post.");
    }
    return trimmed;
  }
  if (!YOUTUBE_HOSTS.has(host) || !youtubeVideoId(trimmed)) {
    throw new Error("That isn't a YouTube video link — paste the link to the video.");
  }
  return trimmed;
}
