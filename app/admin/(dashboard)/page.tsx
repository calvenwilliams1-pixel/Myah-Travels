import React from "react";
import QuickActions from "./components/QuickActions";
import RecentPosts from "./components/RecentPosts";
import ClientInquiries from "./components/ClientInquiries";
import ActivePortals from "./components/ActivePortals";
import RecentActivity from "./components/RecentActivity";
import StorageUsage from "./components/StorageUsage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Myah Travels Admin",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <QuickActions />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentPosts />
        <ClientInquiries />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivePortals />
        <RecentActivity />
      </div>

      <StorageUsage />
    </div>
  );
}
