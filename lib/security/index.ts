import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ============================================
// RATE LIMITING (IP-based, In-Memory)
// ============================================
// NOTE: This is an in-memory implementation for V1.
// It resets on server restart and doesn't work across multiple processes.
// For a single self-hosted mini PC, this is acceptable.
// Future upgrade: Use SQLite-backed rate limiting if needed.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
  req: NextRequest,
  options: {
    maxRequests: number;
    windowSeconds: number;
    identifier?: string;
    prefix: string; // REQUIRED: Prevents cross-endpoint collision
  }
): { success: boolean; remaining: number; resetAt: number } {
  const ip =
    options.identifier ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const key = `${options.prefix}:${ip}`;

  // Lazy cleanup: remove expired entries when encountered
  const entry = rateLimitStore.get(key);
  if (entry && entry.resetAt <= now) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (currentEntry.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  currentEntry.count += 1;
  rateLimitStore.set(key, currentEntry);

  return {
    success: true,
    remaining: options.maxRequests - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

// Pre-configured rate limiters (each with unique prefix)
export const loginRateLimit = (req: NextRequest) =>
  rateLimit(req, { maxRequests: 5, windowSeconds: 900, prefix: "login" });

export const formRateLimit = (req: NextRequest) =>
  rateLimit(req, { maxRequests: 3, windowSeconds: 3600, prefix: "form" });

export const magicLinkRateLimit = (req: NextRequest) =>
  rateLimit(req, { maxRequests: 5, windowSeconds: 3600, prefix: "magic-link" });

export const apiRateLimit = (req: NextRequest) =>
  rateLimit(req, { maxRequests: 100, windowSeconds: 60, prefix: "api" });

// ============================================
// INPUT VALIDATION (Zod Schemas)
// ============================================

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

export const clientInquirySchema = z
  .object({
    fullName: z.string().min(1).max(200),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().max(200).optional().nullable(),
    howFound: z.string().max(50).optional().nullable(),
    destination: z.string().max(200).optional().nullable(),
    tripDurationDays: z.number().int().min(1).max(365).optional().nullable(),
    departureMonthYear: z.string().max(20).optional().nullable(),
    returnMonthYear: z.string().max(20).optional().nullable(),
    bestTimeToContact: z.string().max(50).optional().nullable(),
    consentToContact: z.boolean().default(false),
    customStatement: z.string().max(5000).optional().nullable(),
  })
  .refine(
    (data) =>
      (data.phone && data.phone.trim().length > 0) ||
      (data.email && data.email.trim().length > 0),
    {
      message: "At least phone or email is required",
      path: ["phone"],
    }
  );

export const portalMemberSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(200).optional().nullable(),
});

export const portalNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().default(false),
  isGlobalAnnouncement: z.boolean().default(false),
});

export const postSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published", "hidden", "scheduled"]).default("draft"),
  featuredImage: z.string().max(500).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
});

export const guideSchema = postSchema.extend({
  headerImage: z.string().max(500).optional().nullable(),
  quickReference: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const reviewSchema = postSchema.extend({
  reviewType: z.enum(["product", "hotel", "cruise", "resort", "excursion"]),
  ratingOverall: z.number().min(0).max(5).optional().nullable(),
  ratingValue: z.number().min(0).max(5).optional().nullable(),
  ratingQuality: z.number().min(0).max(5).optional().nullable(),
  ratingComfort: z.number().min(0).max(5).optional().nullable(),
  ratingFamily: z.number().min(0).max(5).optional().nullable(),
  pros: z.string().optional().nullable(),
  cons: z.string().optional().nullable(),
  wouldRecommend: z.enum(["yes", "no", "depends"]).optional().nullable(),
  finalVerdict: z.string().max(2000).optional().nullable(),
});

export function validateLogin(input: unknown) {
  return loginSchema.safeParse(input);
}

export function validateClientInquiry(input: unknown) {
  return clientInquirySchema.safeParse(input);
}

export function validatePost(input: unknown) {
  return postSchema.safeParse(input);
}

export function validateGuide(input: unknown) {
  return guideSchema.safeParse(input);
}

export function validateReview(input: unknown) {
  return reviewSchema.safeParse(input);
}

export function validatePortalNotice(input: unknown) {
  return portalNoticeSchema.safeParse(input);
}

export function validatePortalMember(input: unknown) {
  return portalMemberSchema.safeParse(input);
}

// ============================================
// SECURITY HEADERS
// ============================================
// NOTE: These are also configured in next.config.ts.
// This export serves as a reference for programmatic use if needed.
// The next.config.ts version is the source of truth for route-level application.

export const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.youtube.com https://*.ytimg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://fonts.googleapis.com https://challenges.cloudflare.com",
    "frame-src 'self' https://www.youtube.com https://www.instagram.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Sanitizes plain text input to prevent XSS.
 * WARNING: Do NOT use this on TipTap JSON content or structured data.
 * Only use for plain text fields (e.g., customStatement, notes).
 * React already escapes JSX by default, so plain text is safe.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function isValidEmail(email: string): boolean {
  const emailSchema = z.string().email();
  return emailSchema.safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
  return phoneRegex.test(phone);
}
