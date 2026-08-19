import { NextRequest, NextResponse } from "next/server";
import { suppressEmail } from "@/lib/email";
import { Webhook } from "svix";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = {
      "svix-id": req.headers.get("svix-id") || "",
      "svix-timestamp": req.headers.get("svix-timestamp") || "",
      "svix-signature": req.headers.get("svix-signature") || "",
    };

    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET || "");

    try {
      wh.verify(payload, headers);
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(payload);
    const { type, data } = body;

    if (!type || !data || !data.email) {
      return NextResponse.json({ received: true });
    }

    switch (type) {
      case "email.bounced":
      case "email.complained":
        await suppressEmail(data.email, "all_emails");
        console.log(`Email suppressed due to ${type}: ${data.email}`);
        break;

      case "email.delivered":
      case "email.clicked":
      case "email.opened":
        break;

      default:
        console.log(`Unhandled webhook event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ received: true });
  }
}
