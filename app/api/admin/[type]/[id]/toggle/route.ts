import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, guides, reviews } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

const tableMap = {
  posts,
  guides,
  reviews,
};

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = params;
  const table = tableMap[type as keyof typeof tableMap];

  if (!table) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { field } = body;

  if (typeof field !== "string" || !["isPinned", "isHighlighted"].includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const postId = parseInt(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const current = await db.select().from(table).where(eq(table.id, postId)).limit(1);
  if (current.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newValue = field === "isPinned" ? !current[0].isPinned : !current[0].isHighlighted;

  await db.update(table)
    .set({
      [field]: newValue,
      ...(field === "isPinned" && newValue ? { pinnedAt: new Date().toISOString() } : {}),
    })
    .where(eq(table.id, postId));

  const updated = await db.select().from(table).where(eq(table.id, postId)).limit(1);

  return NextResponse.json(updated[0]);
}
