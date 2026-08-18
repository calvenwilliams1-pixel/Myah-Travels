import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  async function handleLogout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Myah Travels Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Logged in as {user.username}
            </span>
            <form action={handleLogout}>
              <Button variant="ghost" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
