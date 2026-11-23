import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAuth } from "@/lib/auth";
import { layoutSailingDays } from "@/lib/itineraries/sailing";

const BodySchema = z.object({
  stayId: z.number(),
  ports: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const sectionId = Number(params.id);
    if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "stayId and a port list are required" }, { status: 400 });
    }

    try {
      const result = await layoutSailingDays(sectionId, parsed.data.stayId, parsed.data.ports);
      return NextResponse.json({ success: true, ...result });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not lay out the sailing days" },
        { status: 400 }
      );
    }
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
