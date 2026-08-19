import React from "react";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "Blog | Myah Travels",
  description: "Travel tips, guides, and stories from Myah.",
};

export default async function BlogPage() {
  const posts = await getPosts({ status: "published" });

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Blog</h1>
      <p className="text-gray-600 mb-8">Travel stories, tips, and insights.</p>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} padding="md">
              <Link href={`/blog/${post.slug}`} className="block hover:text-emerald-700">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No posts yet. Check back soon!</p>
      )}
    </div>
  );
}
