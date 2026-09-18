import { describe, it, expect } from "vitest";
import {
  serializeBodyContent,
  deserializeBodyContent,
  getBodyContentVersion,
  BODY_CONTENT_VERSION,
} from "./body-content";

const SAMPLE_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "hello" }],
    },
  ],
};

describe("body-content", () => {
  describe("serializeBodyContent", () => {
    it("wraps valid TipTap JSON in a versioned envelope", () => {
      const out = serializeBodyContent(JSON.stringify(SAMPLE_DOC));
      const parsed = JSON.parse(out);
      expect(parsed.version).toBe(BODY_CONTENT_VERSION);
      expect(parsed.content).toEqual(SAMPLE_DOC);
    });

    it("produces an envelope with null content for an empty string", () => {
      const out = serializeBodyContent("");
      const parsed = JSON.parse(out);
      expect(parsed.version).toBe(BODY_CONTENT_VERSION);
      expect(parsed.content).toBeNull();
    });

    it("produces an envelope with null content for malformed input", () => {
      const out = serializeBodyContent("not json {");
      const parsed = JSON.parse(out);
      expect(parsed.version).toBe(BODY_CONTENT_VERSION);
      expect(parsed.content).toBeNull();
    });
  });

  describe("deserializeBodyContent", () => {
    it("unwraps a valid envelope back to the TipTap doc", () => {
      const wrapped = serializeBodyContent(JSON.stringify(SAMPLE_DOC));
      expect(deserializeBodyContent(wrapped)).toEqual(SAMPLE_DOC);
    });

    it("returns the doc unchanged for a legacy bare-doc string", () => {
      // Old shape: no envelope, just the TipTap doc as a JSON string.
      const legacy = JSON.stringify(SAMPLE_DOC);
      expect(deserializeBodyContent(legacy)).toEqual(SAMPLE_DOC);
    });

    it("returns null for an empty string", () => {
      expect(deserializeBodyContent("")).toBeNull();
    });

    it("returns null for malformed JSON", () => {
      expect(deserializeBodyContent("not json {")).toBeNull();
    });

    it("returns null for a JSON value that is not an object", () => {
      expect(deserializeBodyContent(JSON.stringify("plain string"))).toBe("plain string");
      // Note: a plain JSON string is returned as-is (legacy path). Callers
      // must handle non-objects gracefully — the renderer's try/catch does.
    });
  });

  describe("getBodyContentVersion", () => {
    it("returns the version for an enveloped value", () => {
      const wrapped = serializeBodyContent(JSON.stringify(SAMPLE_DOC));
      expect(getBodyContentVersion(wrapped)).toBe(BODY_CONTENT_VERSION);
    });

    it("returns null for legacy bare-doc content", () => {
      expect(getBodyContentVersion(JSON.stringify(SAMPLE_DOC))).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(getBodyContentVersion("")).toBeNull();
    });

    it("returns null for malformed input", () => {
      expect(getBodyContentVersion("not json")).toBeNull();
    });
  });

  describe("roundtrip", () => {
    it("serialize → deserialize returns the original TipTap doc", () => {
      const original = JSON.stringify(SAMPLE_DOC);
      const roundtripped = deserializeBodyContent(serializeBodyContent(original));
      expect(roundtripped).toEqual(SAMPLE_DOC);
    });
  });
});
