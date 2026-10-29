import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/drizzle/schema";
import { and, isNull, like, desc, eq, sql } from "drizzle-orm";

function escapeLike(q: string): string {
  return q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") === "all" ? "all" : "library";
    const q = url.searchParams.get("q") || "";
    const limitRaw = parseInt(url.searchParams.get("limit") || "24", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 24 : limitRaw), 48);
    const offsetRaw = parseInt(url.searchParams.get("offset") || "0", 10);
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const conditions = [
      isNull(media.deletedAt),
      like(media.fileType, "image/%"),
    ];
    if (scope === "library") {
      conditions.push(eq(media.isLibrary, true));
    }
    if (q) {
      conditions.push(like(media.fileName, `%${escapeLike(q)}%`));
    }
    const where = and(...conditions);

    const items = await db
      .select({
        id: media.id,
        filePath: media.filePath,
        fileName: media.fileName,
        fileType: media.fileType,
        fileSize: media.fileSize,
        altText: media.altText,
        caption: media.caption,
        isLibrary: media.isLibrary,
        uploadedAt: media.uploadedAt,
      })
      .from(media)
      .where(where)
      .orderBy(desc(media.uploadedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(media)
      .where(where);
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("GET /api/media failed:", error);
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
  }
}
