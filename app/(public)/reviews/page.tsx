import React from "react";
import Link from "next/link";
import { getReviews } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "Reviews | Myah Travels",
  description: "Product, hotel, and travel reviews from Myah.",
};

export default async function ReviewsPage() {
  const reviews = await getReviews({ status: "published" });

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Reviews</h1>
      <p className="text-gray-600 mb-8">Honest reviews of travel products and experiences.</p>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review: any) => (
            <Card key={review.id} padding="md">
              <Link href={`/reviews/${review.slug}`} className="block hover:text-emerald-700">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold">{review.title}</h2>
                  {review.ratingOverall != null && (
                    <span className="text-amber-500 font-medium">
                      {review.ratingOverall}/5
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">{review.reviewType}</p>
                {review.excerpt && (
                  <p className="text-gray-600 text-sm">{review.excerpt}</p>
                )}
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No reviews yet.</p>
      )}
    </div>
  );
}
