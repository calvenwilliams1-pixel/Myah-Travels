import React from "react";
import { getGuideBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import { cache } from "react";
import TipTapRenderer from "@/components/editor/TipTapRenderer";

export const revalidate = 3600;

const getGuide = cache(async (slug: string) => {
  return getGuideBySlug(slug);
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const guide = await getGuide(params.slug);
  
  if (!guide || guide.status !== "published" || guide.deletedAt) {
    return { title: "Not Found" };
  }
  
  return {
    title: guide.seoTitle || `${guide.title} | Myah Travels`,
    description: guide.seoDescription || guide.excerpt || guide.title,
  };
}

export default async function GuideDetailPage({ params }: { params: { slug: string } }) {
  const guide = await getGuide(params.slug);

  if (!guide || guide.status !== "published" || guide.deletedAt) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-4">{guide.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: {new Date(guide.updatedAt || guide.createdAt).toLocaleDateString()}
      </p>
      
      {guide.quickReference && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h2 className="font-semibold mb-2">Quick Reference</h2>
          <pre className="text-sm whitespace-pre-wrap">{guide.quickReference}</pre>
        </div>
      )}
      
      <TipTapRenderer content={guide.content} />
    </article>
  );
}
