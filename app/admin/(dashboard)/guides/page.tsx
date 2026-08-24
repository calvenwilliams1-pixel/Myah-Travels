import React from "react";
import Link from "next/link";
import { getGuides } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import FeedAdminControls from "@/components/admin/FeedAdminControls";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Destination Guides</h2>
        <Link href="/admin/guides/new">
          <Button>+ New Guide</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table
          columns={[
            {
              header: "Title",
              accessor: (guide: any) => (
                <Link href={`/admin/guides/${guide.id}`} className="font-medium hover:text-emerald-700">
                  {guide.title}
                </Link>
              ),
            },
            {
              header: "Status",
              accessor: (guide: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  guide.status === "published" ? "bg-emerald-100 text-emerald-800" :
                  guide.status === "draft" ? "bg-gray-100 text-gray-600" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {guide.status}
                </span>
              ),
            },
            {
              header: "Created",
              accessor: (guide: any) =>
                new Date(guide.createdAt).toLocaleDateString(),
            },
            {
              header: "Feed",
              accessor: (guide: any) => (
                <FeedAdminControls
                  postId={guide.id}
                  isPinned={guide.isPinned || false}
                  isHighlighted={guide.isHighlighted || false}
                  apiPath={`/api/admin/guides/${guide.id}/toggle`}
                />
              ),
            },
          ]}
          data={guides}
          keyExtractor={(guide) => guide.id}
          emptyMessage="No guides yet."
        />
      </Card>
    </div>
  );
}
