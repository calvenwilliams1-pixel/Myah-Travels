import { describe, it, expect } from "vitest";
import { youtubeVideoId, cleanSocialUrl } from "./social";

describe("youtubeVideoId", () => {
  it("reads watch URLs", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
  });
  it("reads youtu.be, shorts, embed and live URLs", () => {
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects channels, junk and other hosts", () => {
    expect(youtubeVideoId("https://www.youtube.com/@SomeChannel")).toBeNull();
    expect(youtubeVideoId("https://vimeo.com/12345678901")).toBeNull();
    expect(youtubeVideoId("not a url")).toBeNull();
    expect(youtubeVideoId("")).toBeNull();
    expect(youtubeVideoId(null)).toBeNull();
  });
});

describe("cleanSocialUrl", () => {
  it("passes valid links through trimmed", () => {
    expect(cleanSocialUrl("  https://www.instagram.com/p/ABC123/  ", "instagram")).toBe("https://www.instagram.com/p/ABC123/");
    expect(cleanSocialUrl("https://youtu.be/dQw4w9WgXcQ", "youtube")).toBe("https://youtu.be/dQw4w9WgXcQ");
  });
  it("treats empty as null without throwing", () => {
    expect(cleanSocialUrl("", "instagram")).toBeNull();
    expect(cleanSocialUrl("   ", "youtube")).toBeNull();
    expect(cleanSocialUrl(undefined, "youtube")).toBeNull();
  });
  it("throws on the wrong platform or junk", () => {
    expect(() => cleanSocialUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "instagram")).toThrow();
    expect(() => cleanSocialUrl("https://www.instagram.com/p/ABC123/", "youtube")).toThrow();
    expect(() => cleanSocialUrl("instagram.com/p/ABC", "instagram")).toThrow();
    expect(() => cleanSocialUrl("https://www.youtube.com/@Channel", "youtube")).toThrow();
  });
});
