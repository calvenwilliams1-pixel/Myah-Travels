import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { validatePortalSession } from "@/lib/portal";
import { db } from "@/lib/db";
import { portalItems, contentLibrary, media, portalMembers, posts, guides, reviews } from "@/drizzle/schema";
import { eq, and, like, or, isNull, sql } from "drizzle-orm";
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

  // Auth 3 — public content. Files referenced by published, non-deleted
  // posts/guides/reviews (block image URLs in the content JSON, featured and
  // header images) are public by definition: the pages that embed them are
  // served to anonymous visitors, so the files must be too. Everything else
  // (portal documents, unreferenced uploads) stays gated behind Auth 1/2.
  if (!isAdmin && portalIdForSession === null) {
    const needle = `/api/uploads/${rel}`;
    const referenced = (col: unknown) => sql`instr(${col}, ${needle}) > 0`;
    const [inPosts, inGuides, inReviews] = await Promise.all([
      db
        .select({ id: posts.id })
        .from(posts)
        .where(
          and(
            eq(posts.status, "published"),
            isNull(posts.deletedAt),
            or(referenced(posts.content), referenced(posts.featuredImage))
          )
        )
        .limit(1),
      db
        .select({ id: guides.id })
        .from(guides)
        .where(
          and(
            eq(guides.status, "published"),
            isNull(guides.deletedAt),
            or(
              referenced(guides.content),
              referenced(guides.featuredImage),
              referenced(guides.headerImage)
            )
          )
        )
        .limit(1),
      db
        .select({ id: reviews.id })
        .from(reviews)
        .where(
          and(
            eq(reviews.status, "published"),
            isNull(reviews.deletedAt),
            or(referenced(reviews.content), referenced(reviews.featuredImage))
          )
        )
        .limit(1),
    ]);
    if (inPosts.length === 0 && inGuides.length === 0 && inReviews.length === 0) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
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
      // Library documents live on the content_library row, not on
      // portal_items — a file Myah uploaded once and attached to this
      // portal must open for its clients too.
      const libraryCandidates = await db
        .select({ id: contentLibrary.id })
        .from(portalItems)
        .innerJoin(contentLibrary, eq(portalItems.contentLibraryId, contentLibrary.id))
        .where(
          and(
            eq(portalItems.portalId, portalIdForSession),
            like(contentLibrary.filePath, `%${rel}`)
          )
        )
        .limit(1);

      if (libraryCandidates.length === 0) {
        // Not a portal-attached file — deny
        return new NextResponse("Forbidden", { status: 403 });
      }
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
