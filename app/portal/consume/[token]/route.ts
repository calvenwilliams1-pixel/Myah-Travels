import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink, getPortalById, validatePortalSession } from "@/lib/portal";
import { cookies, headers } from "next/headers";
import { magicLinkRateLimit, getClientIp } from "@/lib/security";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const rateLimitResult = magicLinkRateLimit(ip);
  if (!rateLimitResult.success) {
    return new NextResponse("Too many attempts. Please try again later.", { status: 429 });
  }

  const result = await consumeMagicLink(params.token);

  if (!result) {
    return NextResponse.redirect(new URL(`/portal/access/${params.token}`, req.url));
  }

  const portal = await getPortalById(result.portalId);
  if (!portal) {
    return NextResponse.redirect(new URL(`/portal/access/${params.token}`, req.url));
  }

  // Calculate cookie maxAge from session expiry
  const session = await validatePortalSession(result.sessionId);
  const maxAge = session
    ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
    : 30 * 24 * 60 * 60;

  const cookieStore = await cookies();
  cookieStore.set("portal_session", result.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  });

  return NextResponse.redirect(new URL(`/portal/${portal.slug}`, req.url));
}
