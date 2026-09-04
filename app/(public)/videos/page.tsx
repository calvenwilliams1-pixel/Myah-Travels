import React from "react";
import Image from "next/image";
import { db } from "@/lib/db";
import { videos } from "@/drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

export const metadata = {
  title: "Videos | MyCalTravels",
  description: "Travel videos from Myah.",
};

export default async function VideosPage() {
  const videoList = await db.select().from(videos)
    .where(and(isNull(videos.deletedAt), eq(videos.status, "published")))
    .orderBy(desc(videos.createdAt));

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-2">Videos</h1>
      <p className="text-gray-600 mb-8">Watch my latest travel videos.</p>

      {videoList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videoList.map((video) => (
            <Card key={video.id} padding="sm">
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-emerald-700"
              >
                {video.thumbnailUrl && (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title || "Video thumbnail"}
                    width={480}
                    height={270}
                    className="w-full aspect-video object-cover rounded-lg mb-3"
                  />
                )}
                <h2 className="font-semibold">{video.title || "Untitled Video"}</h2>
                {video.description && (
                  <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                )}
              </a>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No videos yet.</p>
      )}
    </div>
  );
}
