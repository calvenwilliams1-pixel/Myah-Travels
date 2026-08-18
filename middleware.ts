import { NextRequest, NextResponse } from "next/server";
import { lucia } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { session } = await lucia.validateSession(sessionId);

    if (!session) {
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.set(lucia.sessionCookieName, "", { maxAge: 0 });
      return response;
    }

    const response = NextResponse.next();

    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
