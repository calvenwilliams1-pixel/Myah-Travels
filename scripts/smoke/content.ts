import { generateSlug, extractTextFromTipTap } from "@/lib/content";

function testSlugGeneration() {
  const slug = generateSlug("My Amazing Trip to Japan!");
  if (slug !== "my-amazing-trip-to-japan") throw new Error(`Slug failed: ${slug}`);
  console.log("✅ Slug generation works");
}

function testTipTapExtraction() {
  const json = JSON.stringify({
    type: "doc",
    content: [
      { type: "paragraph", content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "World" },
      ]},
    ],
  });

  const text = extractTextFromTipTap(json);
  if (text !== "Hello World") throw new Error(`Extraction failed: ${text}`);
  console.log("✅ TipTap text extraction works");
}

function testInvalidJson() {
  const result = extractTextFromTipTap("not-json");
  if (result !== "") throw new Error("Should return empty for invalid JSON");
  console.log("✅ Invalid JSON handled safely");
}

export function runContentTests() {
  testSlugGeneration();
  testTipTapExtraction();
  testInvalidJson();
  console.log("✅ Content tests passed");
}

runContentTests();
