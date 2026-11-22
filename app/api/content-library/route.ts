import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getLibraryItems, addLibraryItem } from "@/lib/content-library";
import { AddLibraryItemSchema } from "@/lib/validation/portal";

export async function GET(req: NextRequest) { try {
  const user = await requireAuth();

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const items = await getLibraryItems({ category, search });

  return NextResponse.json({ items });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest) { try {
  const user = await requireAuth();

  const body = await req.json();
  const parsed = AddLibraryItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const item = await addLibraryItem(parsed.data);

  return NextResponse.json({ success: true, item: item[0] });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
