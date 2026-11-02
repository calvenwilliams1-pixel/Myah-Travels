import React from "react";
import { getPostBySlug } from "@/lib/content";
import { notFound } from "next/navigation";
import { cache } from "react";
import PostRenderer from "@/components/editor/renderers/PostRenderer";
import { parsePostContent } from "@/lib/blocks/parse-post-content";

export const revalidate = 3600;

const getPost = cache(async (slug: string) => {
  return getPostBySlug(slug);
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  
  if (!post || post.status !== "published" || post.deletedAt) {
    return { title: "Not Found" };
  }
  
  return {
    title: post.seoTitle || `${post.title} | MyCalTravels`,
    description: post.seoDescription || post.excerpt || post.title,
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post || post.status !== "published" || post.deletedAt) {
    notFound();
  }

  const dateString = post.publishedAt ?? post.createdAt;
  const parsed = await parsePostContent(post.content);

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-4">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {dateString ? new Date(dateString).toLocaleDateString() : "Not available"}
      </p>
      {parsed ? (
        <PostRenderer blocks={parsed.blocks} template={parsed.template} isPreview={false} />
      ) : (
        <p className="text-gray-500 italic">Content unavailable.</p>
      )}
    </article>
  );
}
