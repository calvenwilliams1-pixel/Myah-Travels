import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { exportClientsToCSV } from "@/lib/clients";
import { logActivity } from "@/lib/logging";

export async function GET() {
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
  } catch (error) {
    console.error("CSV export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
