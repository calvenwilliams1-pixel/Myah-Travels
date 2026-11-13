import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { validatePortalSession } from "@/lib/portal";
import { db } from "@/lib/db";
import { portalItems, contentLibrary, media, portalMembers } from "@/drizzle/schema";
import { eq, and, like } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "data", "uploads");

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.join("/");

  // Reject traversal
  if (rel.includes("..") || rel.startsWith("/")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const abs = path.join(UPLOADS_DIR, rel);

  // Ensure resolved path stays inside UPLOADS_DIR
  const realRoot = path.resolve(UPLOADS_DIR);
  const realFile = path.resolve(abs);
  if (!realFile.startsWith(realRoot + path.sep) && realFile !== realRoot) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Auth 1 — admin
  const admin = await getCurrentUser();
  const isAdmin = !!admin;

  // Auth 2 — portal session (may be needed for portal docs)
  let portalIdForSession: number | null = null;
  if (!isAdmin) {
    const cookieStore = await cookies();
    const sid = cookieStore.get("portal_session")?.value;
    if (sid) {
      const session = await validatePortalSession(sid);
      if (session) portalIdForSession = session.portalId;
    }
  }

  if (!isAdmin && portalIdForSession === null) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // If portal session (not admin), verify this file is attached to their portal
  if (!isAdmin && portalIdForSession !== null) {
    // Does any portal_items row for this portal reference this file path?
    // Stored file_path is relative (e.g. "posts/foo.pdf") — match flexibly.
    const candidates = await db
      .select({ id: portalItems.id })
      .from(portalItems)
      .where(
        and(
          eq(portalItems.portalId, portalIdForSession),
          like(portalItems.filePath, `%${rel}`)
        )
      )
      .limit(1);

    if (candidates.length === 0) {
      // Not a portal-attached file — deny
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Read file
  let data: Buffer;
  try {
    data = await fs.readFile(abs);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=300",
    },
  });
}
