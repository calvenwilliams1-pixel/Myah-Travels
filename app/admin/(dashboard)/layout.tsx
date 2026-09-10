import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, destroySession } from "@/lib/auth";
import ThemeProvider from "@/components/theme/ThemeProvider";
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
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">MyCalTravels Admin</h1>
          <div className="flex items-center gap-6">
             <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-primary">
                Dashboard
              </Link>
              <Link href="/admin/homepage" className="text-sm text-gray-600 hover:text-primary">
                Homepage
              </Link>
              <Link href="/admin/posts" className="text-sm text-gray-600 hover:text-primary">
                Posts
              </Link>
              <Link href="/admin/templates" className="text-sm text-gray-600 hover:text-primary">
                Templates
              </Link>

              <Link href="/admin/media" className="text-sm text-gray-600 hover:text-primary">
                Media
              </Link>
              <Link href="/admin/content-library" className="text-sm text-gray-600 hover:text-primary">
                Content Library
              </Link>
              <Link href="/admin/content-library" className="text-sm text-gray-600 hover:text-primary">
                Content Library
              </Link>
              <Link href="/admin/clients" className="text-sm text-gray-600 hover:text-primary">
                Clients
              </Link>
              <Link href="/admin/portals" className="text-sm text-gray-600 hover:text-primary">
                Portals
              </Link>
              <Link href="/admin/settings" className="text-sm text-gray-600 hover:text-primary">
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
    </ThemeProvider>
  );
}
