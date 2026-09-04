import React from "react";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export default async function FeaturedContent() {
  const posts = await getPosts({ status: "published", limit: 3 });

  if (!posts || posts.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">Latest Stories</h2>
          <p className="text-gray-500">Stories coming soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-8">Latest Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post: any) => {
            const displayDate = post.publishedAt || post.createdAt;
            const formattedDate = displayDate
              ? new Date(displayDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <Card key={post.id} padding="md">
                <Link href={`/blog/${post.slug}`} className="block hover:text-emerald-700">
                  <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>
                  )}
                  {formattedDate && (
                    <p className="text-xs text-gray-400">{formattedDate}</p>
                  )}
                </Link>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/blog" className="text-emerald-700 font-medium hover:underline">
            View all posts →
          </Link>
        </div>
      </div>
    </section>
  );
}
