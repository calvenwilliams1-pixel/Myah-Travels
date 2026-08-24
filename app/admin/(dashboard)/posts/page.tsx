import React from "react";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import FeedAdminControls from "@/components/admin/FeedAdminControls";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Blog Posts</h2>
        <Link href="/admin/posts/new">
          <Button>+ New Post</Button>
        </Link>
      </div>

      <Card padding="none">
        <Table
          columns={[
            {
              header: "Title",
              accessor: (post: any) => (
                <Link href={`/admin/posts/${post.id}`} className="font-medium hover:text-emerald-700">
                  {post.title}
                </Link>
              ),
            },
            {
              header: "Status",
              accessor: (post: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === "published" ? "bg-emerald-100 text-emerald-800" :
                  post.status === "draft" ? "bg-gray-100 text-gray-600" :
                  post.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {post.status}
                </span>
              ),
            },
            {
              header: "Created",
              accessor: (post: any) =>
                new Date(post.createdAt).toLocaleDateString(),
            },
            {
              header: "Feed",
              accessor: (post: any) => (
                <FeedAdminControls
                  postId={post.id}
                  isPinned={post.isPinned || false}
                  isHighlighted={post.isHighlighted || false}
                  apiPath={`/api/admin/posts/${post.id}/toggle`}
                />
              ),
            },
          ]}
          data={posts}
          keyExtractor={(post) => post.id}
          emptyMessage="No posts yet. Create your first post!"
        />
      </Card>
    </div>
  );
}
