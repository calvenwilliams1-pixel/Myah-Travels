import React from "react";
import Link from "next/link";
import { getReviews } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <Link href="/admin/reviews/new">
          <Button>+ New Review</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table
          columns={[
            {
              header: "Title",
              accessor: (review: any) => (
                <Link href={`/admin/reviews/${review.id}`} className="font-medium hover:text-emerald-700">
                  {review.title}
                </Link>
              ),
            },
            {
              header: "Type",
              accessor: (review: any) => review.reviewType,
            },
            {
              header: "Rating",
              accessor: (review: any) =>
                review.ratingOverall ? `${review.ratingOverall}/5` : "—",
            },
            {
              header: "Status",
              accessor: (review: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  review.status === "published" ? "bg-emerald-100 text-emerald-800" :
                  review.status === "draft" ? "bg-gray-100 text-gray-600" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {review.status}
                </span>
              ),
            },
          ]}
          data={reviews}
          keyExtractor={(review) => review.id}
          emptyMessage="No reviews yet."
        />
      </Card>
    </div>
  );
}
