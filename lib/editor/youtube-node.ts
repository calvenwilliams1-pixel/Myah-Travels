import { Node } from "@tiptap/core";

// YouTube video IDs are exactly 11 characters of [A-Za-z0-9_-].
function isValidVideoId(id: string | null): boolean {
  if (!id) return false;
  return /^[\w-]{11}$/.test(id);
}

// TipTap node that renders a YouTube iframe. Used when a bare YouTube
// URL is pasted into the editor. Stored as { videoId: string }.

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      insertYouTubeEmbed: (videoId: string) => ReturnType;
    };
  }
}

export const YouTubeEmbedNode = Node.create({
  name: "youtubeEmbed",
  group: "block",
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      videoId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-youtube-id"),
        renderHTML: (attributes) => ({
          "data-youtube-id": attributes.videoId,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-youtube-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes["data-youtube-id"];

    if (!isValidVideoId(videoId)) {
      return [
        "div",
        {
          "data-youtube-id": videoId || "",
          class: "youtube-embed youtube-embed-invalid",
        },
        [
          "div",
          {
            class: "p-4 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500 text-center",
          },
          "Video unavailable — the YouTube link may be invalid or private.",
        ],
      ];
    }

    return [
      "div",
      { "data-youtube-id": videoId, class: "youtube-embed" },
      [
        "iframe",
        {
          src: "https://www.youtube.com/embed/" + videoId,
          width: "100%",
          height: "360",
          frameborder: "0",
          allowfullscreen: "true",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        },
      ],
    ];
  },

  addCommands() {
    return {
      insertYouTubeEmbed:
        (videoId: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { videoId },
          });
        },
    };
  },
});
