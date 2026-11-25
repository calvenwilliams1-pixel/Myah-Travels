import { NextResponse } from "next/server";

/**
 * Gone (Cal, 2026-11-24): the canvas system was dropped entirely,
 * this API with it. The route file stays as a tombstone returning
 * 410 because the GitHub snapshot push cannot delete files.
 */
function gone() {
  return NextResponse.json({ error: "The canvas system has been removed." }, { status: 410 });
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}

export async function PUT() {
  return gone();
}

export async function PATCH() {
  return gone();
}

export async function DELETE() {
  return gone();
}
