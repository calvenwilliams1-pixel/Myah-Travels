import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
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
          <div className="flex items-center gap-6">
             <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-emerald-700">
                Dashboard
              </Link>
              <Link href="/admin/homepage" className="text-sm text-gray-600 hover:text-emerald-700">
                Homepage
              </Link>
              <Link href="/admin/posts" className="text-sm text-gray-600 hover:text-emerald-700">
                Posts
              </Link>
              <Link href="/admin/templates" className="text-sm text-gray-600 hover:text-emerald-700">
                Templates
              </Link>

              <Link href="/admin/media" className="text-sm text-gray-600 hover:text-emerald-700">
                Media
              </Link>
              <Link href="/admin/clients" className="text-sm text-gray-600 hover:text-emerald-700">
                Clients
              </Link>
              <Link href="/admin/portals" className="text-sm text-gray-600 hover:text-emerald-700">
                Portals
              </Link>
              <Link href="/admin/settings" className="text-sm text-gray-600 hover:text-emerald-700">
                Settings
              </Link>
            </nav>
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
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
