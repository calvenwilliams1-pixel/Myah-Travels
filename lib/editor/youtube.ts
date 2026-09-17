// ============================================================
// YOUTUBE URL DETECTION (Phase 7.9 Wave B)
// Detects YouTube URLs in pasted text and extracts the video ID.
// Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
// youtube.com/shorts/ID, m.youtube.com variants.
// ============================================================

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /m\.youtube\.com\/watch\?v=([\w-]{11})/,
];

/**
 * Extracts a YouTube video ID from a string if a valid YouTube URL is
 * present. Returns null if no valid URL found.
 */
export function extractYouTubeId(text: string): string | null {
  const trimmed = text.trim();
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * True if the text looks like a bare URL (nothing but the URL, possibly
 * with surrounding whitespace). Prevents converting prose that happens
 * to contain a URL.
 */
export function isBareYouTubeUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Reject if there's whitespace in the middle (means prose, not a URL)
  if (/\s/.test(trimmed)) return false;
  return extractYouTubeId(trimmed) !== null;
}
