import React from "react";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export default async function RecentPosts() {
  const posts = await getPosts({ limit: 5 });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Posts</h3>
        <Link href="/admin/posts" className="text-sm text-emerald-700 hover:underline">
          View all
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-500 text-sm">No posts yet.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post: any) => (
            <li key={post.id} className="flex items-center justify-between gap-3">
              <Link href={`/admin/posts/${post.id}`} className="text-sm text-gray-700 hover:text-emerald-700 truncate flex-1 min-w-0">
                {post.title}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                post.status === "published" ? "bg-emerald-100 text-emerald-800" :
                post.status === "draft" ? "bg-gray-100 text-gray-600" :
                "bg-amber-100 text-amber-800"
              }`}>
                {post.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
