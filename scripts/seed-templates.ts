// One-time seed: insert the three block templates into the templates table.
// Idempotent — skips if a template with the same slug exists.
//
// Run: npx tsx scripts/seed-templates.ts
// Also invoked by scripts/setup-db.js on fresh install.

import { db } from "../lib/db";
import { templates } from "../drizzle/schema/templates";
import { eq } from "drizzle-orm";

interface SeedTemplate {
  slug: string;
  name: string;
  description: string;
  themeVariant: "minimal" | "travel" | "review";
  sections: Array<{
    id: string;
    type: string;
    label: string;
    state: "required" | "optional" | "disabled";
    maxCount: number;
  }>;
}

const SEEDS: SeedTemplate[] = [
  {
    slug: "story",
    name: "Story",
    description: "Narrative article with hero image and quotes",
    themeVariant: "minimal",
    sections: [
      { id: "story-title", type: "title", label: "Article Title", state: "required", maxCount: 1 },
      { id: "story-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "story-body", type: "body", label: "Main Content", state: "required", maxCount: 99 },
      { id: "story-quote", type: "quote", label: "Pull Quote", state: "optional", maxCount: 5 },
      { id: "story-gallery", type: "gallery", label: "Photo Gallery", state: "optional", maxCount: 3 },
      { id: "story-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
    ],
  },
  {
    slug: "travel-guide",
    name: "Travel Guide",
    description: "Destination guide with quick facts",
    themeVariant: "travel",
    sections: [
      { id: "guide-title", type: "title", label: "Guide Title", state: "required", maxCount: 1 },
      { id: "guide-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "guide-quickfacts", type: "quickFacts", label: "Quick Facts", state: "required", maxCount: 1 },
      { id: "guide-body", type: "body", label: "Guide Content", state: "required", maxCount: 99 },
      { id: "guide-gallery", type: "gallery", label: "Photo Gallery", state: "optional", maxCount: 3 },
      { id: "guide-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
      { id: "guide-callout", type: "callout", label: "Travel Tip", state: "optional", maxCount: 10 },
    ],
  },
  {
    slug: "review",
    name: "Review",
    description: "Product/hotel review with pros & cons",
    themeVariant: "review",
    sections: [
      { id: "review-title", type: "title", label: "Review Title", state: "required", maxCount: 1 },
      { id: "review-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "review-proscons", type: "prosCons", label: "Pros & Cons", state: "required", maxCount: 1 },
      { id: "review-body", type: "body", label: "Review Content", state: "required", maxCount: 99 },
      { id: "review-verdict", type: "verdict", label: "Final Verdict", state: "required", maxCount: 1 },
      { id: "review-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
      { id: "review-quote", type: "quote", label: "Highlight Quote", state: "optional", maxCount: 5 },
    ],
  },
];

async function run() {
  let created = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const existing = await db
      .select()
      .from(templates)
      .where(eq(templates.slug, seed.slug))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const layoutData = JSON.stringify({
      version: 1,
      name: seed.name,
      description: seed.description,
      themeVariant: seed.themeVariant,
      sections: seed.sections,
    });

    await db.insert(templates).values({
      name: seed.name,
      slug: seed.slug,
      contentType: "post",
      layoutData,
      version: 1,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    created++;
  }

  console.log(`  templates: seeded ${created}, skipped ${skipped}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("seed-templates failed:", err);
  process.exit(1);
});
