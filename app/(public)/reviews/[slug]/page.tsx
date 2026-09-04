import React from "react";
import { getReviewBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import { cache } from "react";
import TipTapRenderer from "@/components/editor/TipTapRenderer";

export const revalidate = 3600;

const getReview = cache(async (slug: string) => {
  return getReviewBySlug(slug);
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const review = await getReview(params.slug);
  
  if (!review || review.status !== "published" || review.deletedAt) {
    return { title: "Not Found" };
  }
  
  return {
    title: review.seoTitle || `${review.title} | Myah Travels`,
    description: review.seoDescription || review.excerpt || review.title,
  };
}

export default async function ReviewDetailPage({ params }: { params: { slug: string } }) {
  const review = await getReview(params.slug);

  if (!review || review.status !== "published" || review.deletedAt) {
    notFound();
  }

  const prosList = review.pros
    ? review.pros.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const consList = review.cons
    ? review.cons.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  const dateString = review.publishedAt ?? review.createdAt;

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-semibold">{review.title}</h1>
        {review.ratingOverall != null && (
          <span className="text-amber-500 text-xl font-medium">
            {review.ratingOverall}/5
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-8">
        {review.reviewType} · {dateString ? new Date(dateString).toLocaleDateString() : "Not available"}
      </p>

      {prosList.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Pros</h2>
          <ul className="list-disc pl-6">
            {prosList.map((pro, i) => (
              <li key={i}>{pro}</li>
            ))}
          </ul>
        </div>
      )}

      {consList.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Cons</h2>
          <ul className="list-disc pl-6">
            {consList.map((con, i) => (
              <li key={i}>{con}</li>
            ))}
          </ul>
        </div>
      )}

      {review.wouldRecommend && (
        <p className="mb-6">
          <strong>Would Recommend:</strong> {review.wouldRecommend}
        </p>
      )}

      <TipTapRenderer content={review.content} />

      {review.finalVerdict && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Final Verdict</h2>
          <p>{review.finalVerdict}</p>
        </div>
      )}
    </article>
  );
}
