import { NextRequest, NextResponse } from "next/server";

// SECURITY: Enforce TOTP enrollment for the admin. If the admin has
// not enabled 2FA, block /admin/* routes and redirect to the enrollment
// page. The check itself happens in the layout (server-side) where the
// DB and Lucia session are available — middleware only handles the
// redirect-path allowlist.

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/enroll-2fa",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Allow login + enrollment pages through unconditionally
  for (const p of PUBLIC_ADMIN_PATHS) {
    if (pathname.startsWith(p)) return NextResponse.next();
  }

  // Everything else: let the layout enforce (it has DB access)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
