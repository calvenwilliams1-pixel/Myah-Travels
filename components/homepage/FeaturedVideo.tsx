import React from "react";
import { getFeaturedVideo } from "@/lib/content";
import { Card } from "@/components/ui/Card";

export default async function FeaturedVideo() {
  const featured = await getFeaturedVideo();

  if (!featured || !featured.youtubeId) {
    return null;
  }

  const youtubeId = featured.youtubeId.match(/^[a-zA-Z0-9_-]{11}$/)?.[0];
  if (!youtubeId) return null;

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-8">Featured Video</h2>
        <Card padding="sm">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              title={featured.title || "Featured video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{featured.title || "Featured Video"}</h3>
            {featured.description && (
              <p className="text-sm text-gray-600 mt-1">{featured.description}</p>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
