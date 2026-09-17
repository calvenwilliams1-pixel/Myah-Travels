import React from "react";
import { redirect } from "next/navigation";
import { requireAuth, getUserTotpStatus } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import EnrollTotpForm from "./EnrollTotpForm";

export const dynamic = "force-dynamic";

export default async function Enroll2FAPage() {
  const user = await requireAuth();
  const status = await getUserTotpStatus(Number(user.id));

  if (status.totpEnabled) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <h1 className="text-xl font-semibold mb-2">Set up two-factor authentication</h1>
        <p className="text-sm text-gray-600 mb-4">
          MyCalTravels requires TOTP 2FA on the admin account. Scan the QR code below with an
          authenticator app (Google Authenticator, 1Password, Authy, etc.), then enter the
          6-digit code to confirm.
        </p>
        <EnrollTotpForm />
      </Card>
    </div>
  );
}
