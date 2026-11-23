import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, destroySession, getUserTotpStatus } from "@/lib/auth";
import ThemeProvider from "@/components/theme/ThemeProvider";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Setup guard: users who haven't completed onboarding (or have a pending
  // password change) must finish the wizard before reaching the dashboard.
  if (!user.hasCompletedSetup || user.mustChangePassword) {
    redirect("/admin/setup");
  }

  // TOTP enforcement is gated behind an env var so development and
  // testing can proceed without an authenticator app. At launch,
  // set TOTP_ENFORCEMENT=true on the mini PC — the Launch Day checklist
  // includes this step. See the Security section of the TODO.
  if (process.env.TOTP_ENFORCEMENT === "true") {
    const totpStatus = await getUserTotpStatus(Number(user.id));
    if (!totpStatus.totpEnabled) {
      redirect("/admin/enroll-2fa");
    }
  }

  async function handleLogout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <ThemeProvider>
      {/* --admin-header-h: the sticky AdminHeader's measured height
          (89px at lg+ where the nav wraps inline, ~65–73px below).
          Sticky section headers in long editors offset by it
          (UI Pass 3). */}
      <div className="min-h-screen bg-gray-50 [--admin-header-h:4.5rem] lg:[--admin-header-h:5.75rem]">
        <AdminHeader username={user.username} onLogout={handleLogout} />
        <main className="px-4 sm:px-6 py-6">{children}</main>
      </div>
    </ThemeProvider>
  );
}
