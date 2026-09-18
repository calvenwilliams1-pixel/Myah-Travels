import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import CleanTipTapRenderer from "./CleanTipTapRenderer";

function doc(nodes: any[]): string {
  return JSON.stringify({ type: "doc", content: nodes });
}

function para(text: string, marks?: any[]): any {
  return {
    type: "paragraph",
    content: [{ type: "text", text, marks: marks ?? [] }],
  };
}

function textStyleMark(attrs: Record<string, any>): any {
  return { type: "textStyle", attrs };
}

describe("CleanTipTapRenderer", () => {
  let errorSpy: any;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe("node rendering", () => {
    const cases = [
      { name: "paragraph", json: doc([para("hello")]), expectTag: "<p>" },
      { name: "heading level 1", json: doc([{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] }]), expectTag: "<h1>" },
      { name: "heading level 2", json: doc([{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Sub" }] }]), expectTag: "<h2>" },
      { name: "heading level 3", json: doc([{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Sub-sub" }] }]), expectTag: "<h3>" },
      { name: "bullet list", json: doc([{ type: "bulletList", content: [{ type: "listItem", content: [para("one")] }, { type: "listItem", content: [para("two")] }] }]), expectTag: "<ul>" },
      { name: "ordered list", json: doc([{ type: "orderedList", content: [{ type: "listItem", content: [para("one")] }] }]), expectTag: "<ol>" },
      { name: "blockquote", json: doc([{ type: "blockquote", content: [para("quoted")] }]), expectTag: "<blockquote>" },
      { name: "horizontal rule", json: doc([{ type: "horizontalRule" }]), expectTag: "<hr" },
      { name: "bold mark", json: doc([para("bold", [{ type: "bold" }])]), expectTag: "<strong>" },
      { name: "italic mark", json: doc([para("italic", [{ type: "italic" }])]), expectTag: "<em>" },
      { name: "underline mark", json: doc([para("underline", [{ type: "underline" }])]), expectTag: "<u>" },
      { name: "strike mark", json: doc([para("struck", [{ type: "strike" }])]), expectTag: "<s>" },
      { name: "link mark", json: doc([para("link", [{ type: "link", attrs: { href: "https://example.com" } }])]), expectTag: "<a" },
    ];

    for (const tc of cases) {
      it("renders " + tc.name + " as " + tc.expectTag, () => {
        const { container } = render(<CleanTipTapRenderer content={tc.json} />);
        expect(container.innerHTML).toContain(tc.expectTag);
      });
    }

    it("does not leak raw JSON anywhere in output", () => {
      const json = doc([
        para("styled", [
          textStyleMark({ fontFamily: "Georgia, serif", fontSize: "1.25rem", color: "#ff0000" }),
        ]),
      ]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      const html = container.innerHTML;
      expect(html).not.toContain('"type":"doc"');
      expect(html).not.toContain('"marks":[');
      expect(html).not.toContain('"textStyle"');
    });
  });

  describe("inline styles survive sanitisation", () => {
    it("renders text colour as an inline style", () => {
      const json = doc([para("red", [textStyleMark({ color: "#ff0000" })])]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      // jsdom normalises hex to rgb() in serialized output. Accept both.
      expect(container.innerHTML).toMatch(/color:\s*(#ff0000|rgb\(255,\s*0,\s*0\))/i);
    });

    it("renders font family as an inline style", () => {
      const json = doc([para("georgia", [textStyleMark({ fontFamily: "Georgia, serif" })])]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      expect(container.innerHTML).toMatch(/font-family:\s*Georgia/i);
    });

    it("renders font size as an inline style", () => {
      const json = doc([para("large", [textStyleMark({ fontSize: "1.25rem" })])]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      expect(container.innerHTML).toMatch(/font-size:\s*1\.25rem/i);
    });

    it("renders highlight as a background colour", () => {
      const json = doc([para("hi", [{ type: "highlight", attrs: { color: "#ffff00" } }])]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      // jsdom normalises hex to rgb() in serialized output. Accept both.
      expect(container.innerHTML).toMatch(/background-color:\s*(#ffff00|rgb\(255,\s*255,\s*0\))/i);
    });
  });

  describe("YouTube embed", () => {
    it("renders a YouTube iframe with the sandbox attribute", () => {
      const json = doc([{ type: "youtubeEmbed", attrs: { videoId: "dQw4w9WgXcQ" } }]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      const html = container.innerHTML;
      expect(html).toContain("<iframe");
      expect(html).toContain("youtube.com/embed/dQw4w9WgXcQ");
      expect(html).toMatch(/sandbox="[^"]*allow-scripts[^"]*"/);
    });

    it("does NOT render an iframe for an invalid video ID", () => {
      const json = doc([{ type: "youtubeEmbed", attrs: { videoId: "not-valid" } }]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      const html = container.innerHTML;
      expect(html).not.toContain("<iframe");
      expect(html).toContain("Video unavailable");
    });
  });

  describe("malformed input", () => {
    it("returns null for empty content", () => {
      const { container } = render(<CleanTipTapRenderer content="" />);
      expect(container.innerHTML).toBe("");
    });

    it("returns null for garbage JSON without throwing", () => {
      const { container } = render(<CleanTipTapRenderer content="not json at all {" />);
      expect(container.innerHTML).toBe("");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("returns null for valid JSON that is not a TipTap doc", () => {
      const { container } = render(
        <CleanTipTapRenderer content={JSON.stringify({ some: "object" })} />
      );
      expect(container.innerHTML).toBe("");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("never echoes the raw input into the DOM on failure", () => {
      const garbage = "some raw string that should never appear in output";
      const { container } = render(<CleanTipTapRenderer content={garbage} />);
      expect(container.innerHTML).not.toContain(garbage);
    });
  });

  describe("sanitisation safety", () => {
    it("strips script tags that appear in text content", () => {
      const json = doc([para("<script>alert(1)</script>")]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      expect(container.innerHTML).not.toContain("<script>");
    });

    it("strips javascript: hrefs in links", () => {
      const json = doc([para("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])]);
      const { container } = render(<CleanTipTapRenderer content={json} />);
      expect(container.innerHTML).not.toMatch(/href="javascript:/i);
    });
  });
});
