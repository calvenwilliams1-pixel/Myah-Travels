import { youtubeVideoId } from "@/lib/social";

interface PostSocialLinksProps {
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
}

/**
 * The post's companion social content, shown under the article: the
 * YouTube video plays inline (privacy-enhanced embed), and the
 * Instagram post is a link card (Instagram embeds are unreliable
 * without their script; a clean card always works).
 */
export default function PostSocialLinks({
  instagramUrl,
  youtubeUrl,
}: PostSocialLinksProps) {
  const videoId = youtubeVideoId(youtubeUrl);
  if (!videoId && !instagramUrl) return null;

  return (
    <section className="mt-12 space-y-6">
      {videoId && (
        <div>
          <h2 className="text-h3 font-display mb-3">Watch the trip</h2>
          <div
            className="relative w-full overflow-hidden rounded-2xl shadow-card bg-black"
            style={{ paddingTop: "56.25%" }}
          >
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title="YouTube video for this post"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition-colors hover:border-gray-300"
        >
          <span>
            <span className="block font-display text-lg text-gray-900">
              See this on Instagram
            </span>
            <span className="block text-sm text-gray-600">
              Photos and reels from this trip, as it happened.
            </span>
          </span>
          <span aria-hidden="true" className="text-xl text-gray-400">
            ↗
          </span>
        </a>
      )}
    </section>
  );
}
