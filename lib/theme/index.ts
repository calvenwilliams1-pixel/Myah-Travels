export function clampOpacity(value: string | undefined | null): number {
  const raw = value ?? "1";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1;
}

const ALLOWED_BG_HOSTS = (process.env.ALLOWED_BG_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

export function sanitizeBackgroundImage(path: string | undefined | null): string {
  if (!path || path.trim() === "") return "";
  
  const trimmed = path.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.startsWith("javascript:")) return "";
  if (lower.startsWith("data:")) return "";
  if (lower.startsWith("vbscript:")) return "";
  
  if (lower.startsWith("/uploads/")) return trimmed;
  
  try {
    const url = new URL(trimmed);
    if ((url.protocol === "http:" || url.protocol === "https:") && ALLOWED_BG_HOSTS.length > 0) {
      return ALLOWED_BG_HOSTS.includes(url.hostname) ? trimmed : "";
    }
    if ((url.protocol === "http:" || url.protocol === "https:") && ALLOWED_BG_HOSTS.length === 0) {
      return trimmed;
    }
  } catch {
    // Not a valid absolute URL
  }
  
  return "";
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  
  let r: number, g: number, b: number;
  
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function validateHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
