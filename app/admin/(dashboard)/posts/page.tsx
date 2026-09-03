import React from "react";
import Link from "next/link";
import { getPosts } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import FeedAdminControls from "@/components/admin/FeedAdminControls";
import { deletePostAction, restorePostAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PostsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams.filter || "active";
  const posts = await getPosts({ includeDeleted: filter === "deleted" || filter === "all" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Blog Posts</h2>
        <div className="flex gap-3 items-center">
          <div className="flex gap-1">
            <Link href="/admin/posts?filter=active" className={`px-3 py-1 rounded text-xs ${filter === "active" ? "bg-emerald-700 text-white" : "bg-gray-100"}`}>Active</Link>
            <Link href="/admin/posts?filter=deleted" className={`px-3 py-1 rounded text-xs ${filter === "deleted" ? "bg-red-600 text-white" : "bg-gray-100"}`}>Deleted</Link>
          </div>
          <Link href="/admin/posts/new">
            <Button>+ New Post</Button>
          </Link>
        </div>
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
            {
              header: "Actions",
              accessor: (post: any) => (
                post.deletedAt ? (
                  <form action={restorePostAction.bind(null, post.id)}>
                    <button type="submit" className="text-xs text-emerald-600 hover:text-emerald-800">Restore</button>
                  </form>
                ) : (
                  <form action={deletePostAction.bind(null, post.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:text-red-800">Delete</button>
                  </form>
                )
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
