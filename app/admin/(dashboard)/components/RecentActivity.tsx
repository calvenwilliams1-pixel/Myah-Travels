import React from "react";
import { getRecentActivity } from "@/lib/logging";
import { Card } from "@/components/ui/Card";

export default async function RecentActivity() {
  const activities = await getRecentActivity(10);

  return (
    <Card>
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((activity) => (
            <li key={activity.id} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0">
                {new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="truncate min-w-0">{activity.details || activity.actionType}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
