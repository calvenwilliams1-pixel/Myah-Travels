import React from "react";
import QuickActions from "./components/QuickActions";
import GettingStartedCard from "./components/GettingStartedCard";
import RecentPosts from "./components/RecentPosts";
import ClientInquiries from "./components/ClientInquiries";
import ActivePortals from "./components/ActivePortals";
import RecentActivity from "./components/RecentActivity";
import StorageUsage from "./components/StorageUsage";
import { getCurrentUser } from "@/lib/auth";
import { pickGreeting } from "@/lib/greetings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | MyCalTravels Admin",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const greeting = user ? pickGreeting(Number(user.id)) : null;

  return (
    <div className="space-y-6">
      {greeting && (
        <div className="text-center py-2">
          <p className="text-base italic text-gray-700">
            &ldquo;{greeting.text}&rdquo;
          </p>
          {greeting.attribution && (
            <p className="text-xs text-gray-500 mt-1">— {greeting.attribution}</p>
          )}
        </div>
      )}

      <GettingStartedCard />

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
