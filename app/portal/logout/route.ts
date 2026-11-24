import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyPortalSession, getPublicBaseUrl, isPortalSessionCookieName } from "@/lib/portal";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();

  // Sign out of every portal this browser is signed into.
  for (const cookie of cookieStore.getAll()) {
    if (!isPortalSessionCookieName(cookie.name)) continue;
    try {
      if (cookie.value) await destroyPortalSession(cookie.value);
    } catch {
      // Clearing the cookies below is what signs the browser out;
      // a stale session row expires on its own.
    }
    cookieStore.delete(cookie.name);
  }

  return NextResponse.redirect(new URL("/", getPublicBaseUrl(req.url)));
}
