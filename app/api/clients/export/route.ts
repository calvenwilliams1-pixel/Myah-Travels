import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { exportClientsToCSV } from "@/lib/clients";
import { logActivity } from "@/lib/logging";

export async function GET() { try {
  try {
    const user = await requireAuth();

    const csv = await exportClientsToCSV();

    await logActivity({
      userId: Number(user.id),
      actionType: "export",
      entityType: "client",
      details: "Exported clients to CSV",
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) { if (error instanceof AuthError) { return NextResponse.json({ error: error.message }, { status: error.status }); } 
    console.error("CSV export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
