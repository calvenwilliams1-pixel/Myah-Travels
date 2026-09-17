import { Node } from "@tiptap/core";

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
